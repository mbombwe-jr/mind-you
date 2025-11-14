use std::net::SocketAddr;
use std::sync::Arc;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;
use url::form_urlencoded;

use anyhow::Result;
use http_body_util::{Full, BodyExt};
use hyper::{http, Method, Request, Response};
use hyper::body::{Bytes, Incoming};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use tokio::net::{TcpListener, UdpSocket};
use serde::{Deserialize, Serialize};

use crate::node::{Interface, InterfaceInfo};
use crate::common::allocator;
use crate::common::net::protocol::{TcpMsg, TCP_BUFF_SIZE};
use crate::common::cipher::Cipher;
use rand::{Rng, SeedableRng};

#[derive(Serialize, Deserialize, Clone)]
struct ChatMessage {
    author: String,
    text: String,
    timestamp: u64,
    group_name: String,
}

static GROUP_MESSAGES: Lazy<Mutex<HashMap<String, Vec<ChatMessage>>>> = Lazy::new(|| Mutex::new(HashMap::new()));

struct Context<K> {
    interfaces: Vec<Arc<Interface<K>>>,
}

fn info<K>(
    _req: Request<Incoming>,
    interfaces: &[Arc<Interface<K>>],
) -> Result<Response<Full<Bytes>>, http::Error> {
    let mut list = Vec::with_capacity(interfaces.len());

    for inter in interfaces {
        list.push(InterfaceInfo::from(&**inter));
    }

    let resp = match serde_json::to_vec(&list) {
        Ok(v) => Response::builder()
            .header(http::header::CONTENT_TYPE, "application/json")
            .body(Full::new(Bytes::from(v)))?,
        Err(e) => {
            error!("api server error: {}", e);

            Response::builder()
                .status(500)
                .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                .body(Full::new(Bytes::from(e.to_string())))?
        }
    };
    Ok(resp)
}

#[derive(Deserialize)]
struct BroadcastRequest {
    text: String,
    interface_index: Option<usize>,
    group_name: Option<String>,
}

#[derive(Serialize)]
struct BroadcastResponse {
    success: bool,
    message: String,
}

async fn get_messages(
    req: Request<Incoming>
) -> Result<Response<Full<Bytes>>, http::Error> {
    // Parse ?group_name=...
    let qs = req.uri().query().unwrap_or("");
    let params: HashMap<_, _> = form_urlencoded::parse(qs.as_bytes()).into_owned().collect();
    let group_name = match params.get("group_name") {
        Some(g) => g,
        None => return Ok(Response::builder()
            .status(400)
            .body(Full::new(Bytes::from("group_name required")))?)
    };
    let logs = GROUP_MESSAGES.lock().unwrap();
    let msgs = logs.get(group_name)
        .cloned()
        .unwrap_or_default();
    let json = serde_json::to_vec(&msgs).unwrap();
    Ok(Response::builder()
        .header("content-type", "application/json")
        .body(Full::new(Bytes::from(json)))?)
}

async fn broadcast<K: Cipher + Send + Sync>(
    req: Request<Incoming>,
    interfaces: &[Arc<Interface<K>>],
) -> Result<Response<Full<Bytes>>, http::Error> {
    if *req.method() != Method::POST {
        return Ok(
            Response::builder()
                .status(405)
                .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                .body(Full::new(Bytes::from("Method not allowed")))?
        );
    }

    let body_bytes = match req.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            return Ok(
                Response::builder()
                    .status(400)
                    .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                    .body(Full::new(Bytes::from(format!("Failed to read body: {}", e))))?
            );
        }
    };

    let broadcast_req: BroadcastRequest = match serde_json::from_slice(&body_bytes) {
        Ok(req) => req,
        Err(e) => {
            return Ok(
                Response::builder()
                    .status(400)
                    .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                    .body(Full::new(Bytes::from(format!("Invalid JSON: {}", e))))?
            );
        }
    };

    // Find interface by group_name or interface_index
    let interface = if let Some(group_name) = &broadcast_req.group_name {
        // Find interface by group name
        interfaces.iter().find(|iface| {
            iface.group_name.load().as_ref()
                .map(|name| **name == *group_name)
                .unwrap_or(false)
        })
    } else {
        // Use interface_index or default to 0
        let interface_index = broadcast_req.interface_index.unwrap_or(0);
        interfaces.get(interface_index)
    };

    let interface = match interface {
        Some(iface) => iface,
        None => {
            return Ok(
                Response::builder()
                    .status(404)
                    .header(http::header::CONTENT_TYPE, "application/json")
                    .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                        success: false,
                        message: format!("Interface not found for group_name: {:?} or index: {:?}", 
                            broadcast_req.group_name, broadcast_req.interface_index),
                    }).unwrap())))?
            );
        }
    };

    if !interface.server_is_connected.load(std::sync::atomic::Ordering::Relaxed) {
        return Ok(
            Response::builder()
                .status(503)
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                    success: false,
                    message: "Not connected to server".to_string(),
                }).unwrap())))?
        );
    }

    let tcp_channel = match &interface.tcp_handler_channel {
        Some(channel) => channel,
        None => {
            return Ok(
                Response::builder()
                    .status(503)
                    .header(http::header::CONTENT_TYPE, "application/json")
                    .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                        success: false,
                        message: "TCP channel not available".to_string(),
                    }).unwrap())))?
            );
        }
    };

    let sender_name = interface.node_name.clone();
    let key = &interface.key;
    let mut buff = allocator::alloc(TCP_BUFF_SIZE);
    let mut rng = rand::rngs::SmallRng::from_os_rng();

    // LOG the message for group after successfully forming the broadcast
    if let Some(group_name) = &broadcast_req.group_name {
        let now = Utc::now().timestamp() as u64;
        let msg = ChatMessage {
            author: sender_name.clone(),
            text: broadcast_req.text.clone(),
            timestamp: now,
            group_name: group_name.clone(),
        };
        GROUP_MESSAGES.lock().unwrap()
            .entry(group_name.clone())
            .or_default()
            .push(msg);
    }

    match TcpMsg::broadcast_text_encode(key, rng.random(), &sender_name, &broadcast_req.text, &mut buff) {
        Ok(len) => {
            let mut msg_bytes = allocator::alloc(len);
            msg_bytes[..len].copy_from_slice(&buff[..len]);
            
            match tcp_channel.try_send(msg_bytes) {
                Ok(_) => {
                    Ok(
                        Response::builder()
                            .header(http::header::CONTENT_TYPE, "application/json")
                            .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                                success: true,
                                message: "Broadcast message sent".to_string(),
                            }).unwrap())))?
                    )
                }
                Err(e) => {
                    Ok(
                        Response::builder()
                            .status(500)
                            .header(http::header::CONTENT_TYPE, "application/json")
                            .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                                success: false,
                                message: format!("Failed to send message: {}", e),
                            }).unwrap())))?
                    )
                }
            }
        }
        Err(e) => {
            Ok(
                Response::builder()
                    .status(500)
                    .header(http::header::CONTENT_TYPE, "application/json")
                    .body(Full::new(Bytes::from(serde_json::to_string(&BroadcastResponse {
                        success: false,
                        message: format!("Failed to encode message: {}", e),
                    }).unwrap())))?
            )
        }
    }
}

async fn router<K: Cipher + Send + Sync>(
    ctx: &Context<K>,
    req: Request<Incoming>,
) -> Result<Response<Full<Bytes>>, http::Error> {
    let path = req.uri().path();

    match path {
        "/info" => info(req, ctx.interfaces.as_slice()),
        "/type" => Ok(
            Response::builder()
                .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                .body(Full::new(Bytes::from("node")))?
        ),
        "/broadcast" => broadcast(req, ctx.interfaces.as_slice()).await,
        "/messages" => get_messages(req).await,
        _ => Ok(
            Response::builder()
                .status(404)
                .header(http::header::CONTENT_TYPE, "text/plain; charset=utf-8")
                .body(Full::new(Bytes::new()))?
        ),
    }
}

// UDP API handler for status queries and messages
async fn udp_api_handler<K: Cipher + Send + Sync + 'static>(
    socket: Arc<UdpSocket>,
    interfaces: Vec<Arc<Interface<K>>>,
) -> Result<()> {
    let mut buf = [0u8; 65536];
    
    loop {
        match socket.recv_from(&mut buf).await {
            Ok((len, addr)) => {
                let request_bytes = &buf[..len];
                
                // Try to parse as string first for simple commands
                if let Ok(request_str) = String::from_utf8(request_bytes.to_vec()) {
                    let trimmed = request_str.trim();
                    
                    if trimmed == "INFO" {
                        let mut list = Vec::with_capacity(interfaces.len());
                        for inter in &interfaces {
                            list.push(InterfaceInfo::from(&**inter));
                        }
                        
                        match serde_json::to_vec(&list) {
                            Ok(data) => {
                                if let Err(e) = socket.send_to(&data, addr).await {
                                    warn!("failed to send UDP response: {:?}", e);
                                }
                            }
                            Err(e) => {
                                error!("failed to serialize interface info: {}", e);
                            }
                        }
                        continue;
                    }
                }
                
                // Try to parse as JSON for structured requests
                if let Ok(request_json) = serde_json::from_slice::<serde_json::Value>(request_bytes) {
                    // Handle get_messages request
                    if let Some(msg_type) = request_json.get("type").and_then(|v| v.as_str()) {
                        if msg_type == "get_messages" {
                            if let Some(group_name) = request_json.get("group_name").and_then(|v| v.as_str()) {
                                // Clone messages while holding the lock, then drop the lock before await
                                let msgs = {
                                    let logs = GROUP_MESSAGES.lock().unwrap();
                                    let msgs = logs.get(group_name)
                                        .cloned()
                                        .unwrap_or_default();
                                    drop(logs); // Explicitly drop the lock
                                    msgs
                                };
                                
                                match serde_json::to_vec(&msgs) {
                                    Ok(data) => {
                                        if let Err(e) = socket.send_to(&data, addr).await {
                                            warn!("failed to send UDP messages response: {:?}", e);
                                        }
                                    }
                                    Err(e) => {
                                        error!("failed to serialize messages: {}", e);
                                    }
                                }
                                continue;
                            }
                        }
                    }
                }
                
                // If it's a JSON object but not a recognized request, log it
                // Broadcast messages are handled via HTTP POST /broadcast endpoint
                warn!("Unrecognized UDP JSON request from {}", addr);
            }
            Err(e) => {
                warn!("UDP recv error: {:?}", e);
            }
        }
    }
}

pub(super) async fn api_start<K: Cipher + Send + Sync + 'static>(
    bind: SocketAddr,
    interfaces: Vec<Arc<Interface<K>>>,
) -> Result<()> {
    let ctx = Context { interfaces: interfaces.clone() };
    let ctx = Arc::new(ctx);

    // Start TCP/HTTP API server
    let tcp_bind = bind;
    let listener = TcpListener::bind(tcp_bind).await?;
    info!("api listening on http://{}", tcp_bind);

    // Start UDP API server on same port
    let udp_socket = UdpSocket::bind(bind).await?;
    let udp_socket = Arc::new(udp_socket);
    info!("UDP api listening on udp://{}", bind);
    
    let udp_interfaces = interfaces.clone();
    let udp_socket_clone = udp_socket.clone();
    tokio::spawn(async move {
        if let Err(e) = udp_api_handler(udp_socket_clone.clone(), udp_interfaces.clone()).await {
            error!("UDP API handler error: {:?}", e);
        }
    });

    loop {
        let (stream, _) = listener.accept().await?;
        let stream = hyper_util::rt::TokioIo::new(stream);
        let ctx = ctx.clone();

        tokio::spawn(async move {
            let ctx = &ctx;
            let res = http1::Builder::new()
                .serve_connection(
                    stream,
                    service_fn(move |req| router(ctx, req)),
                )
                .await;

            if let Err(e) = res {
                warn!("error serving connection: {:?}", e);
            }
        });
    }
}
