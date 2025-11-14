use serde_json::Value;
use tokio::net::UdpSocket;
use tokio::time::{timeout, Duration, interval};
use tauri::{AppHandle, Emitter};

async fn fetch_network_info_udp() -> Result<Value, String> {
    // Use UDP to query the network node API
    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .map_err(|e| format!("Failed to bind UDP socket: {}", e))?;
    
    // Send "INFO" request to network node API
    let api_addr = "127.0.0.1:3030";
    socket.send_to(b"INFO", api_addr)
        .await
        .map_err(|e| format!("Failed to send UDP request: {}", e))?;
    
    // Receive response with timeout
    let mut buf = [0u8; 65536];
    match timeout(Duration::from_secs(2), socket.recv_from(&mut buf)).await {
        Ok(Ok((len, _))) => {
            let response = &buf[..len];
            serde_json::from_slice::<Value>(response)
                .map_err(|e| format!("Failed to parse JSON response: {}", e))
        }
        Ok(Err(e)) => Err(format!("Failed to receive UDP response: {}", e)),
        Err(_) => Err("UDP request timeout".to_string())
    }
}

#[tauri::command]
pub async fn get_network_info() -> Result<Value, String> {
    fetch_network_info_udp().await
}

pub async fn start_network_info_emitter(app: AppHandle) -> Result<(), String> {
    // Start a background task that emits network info events
    tokio::spawn(async move {
        let mut interval = interval(Duration::from_millis(500)); // Emit every 500ms for fast updates
        
        loop {
            interval.tick().await;
            
            match fetch_network_info_udp().await {
                Ok(info) => {
                    if let Err(e) = app.emit("network-info-update", &info) {
                        eprintln!("Failed to emit network-info-update event: {}", e);
                        // If emit fails, the app might be closing, so break the loop
                        break;
                    }
                }
                Err(e) => {
                    // Emit error event
                    let _ = app.emit("network-info-error", &e);
                }
            }
        }
    });
    
    Ok(())
}

#[tauri::command]
pub async fn send_channel_message(group_name: String, message: String) -> Result<Value, String> {
    // Use HTTP POST to send channel message to network node API
    let client = reqwest::Client::new();
    
    // Create JSON payload for broadcast message
    let payload = serde_json::json!({
        "text": message,
        "group_name": group_name
    });
    
    // Send HTTP POST request to network node API
    let api_url = "http://127.0.0.1:3030/broadcast";
    let response = client
        .post(api_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send HTTP request: {}", e))?;
    
    if response.status().is_success() {
        response.json::<Value>()
            .await
            .map_err(|e| format!("Failed to parse JSON response: {}", e))
    } else {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("HTTP error {}: {}", status, error_text))
    }
}

#[tauri::command]
pub async fn get_channel_messages(group_name: String) -> Result<Value, String> {
    // Use UDP to get messages from network node API
    let socket = UdpSocket::bind("0.0.0.0:0")
        .await
        .map_err(|e| format!("Failed to bind UDP socket: {}", e))?;
    
    // Create JSON payload for get_messages request
    let payload = serde_json::json!({
        "type": "get_messages",
        "group_name": group_name
    });
    let json_bytes = serde_json::to_vec(&payload)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;
    
    // Send request to network node API
    let api_addr = "127.0.0.1:3030";
    socket.send_to(&json_bytes, api_addr)
        .await
        .map_err(|e| format!("Failed to send UDP request: {}", e))?;
    
    // Receive response with timeout
    let mut buf = [0u8; 65536];
    match timeout(Duration::from_secs(2), socket.recv_from(&mut buf)).await {
        Ok(Ok((len, _))) => {
            let response = &buf[..len];
            serde_json::from_slice::<Value>(response)
                .map_err(|e| format!("Failed to parse JSON response: {}", e))
        }
        Ok(Err(e)) => Err(format!("Failed to receive UDP response: {}", e)),
        Err(_) => Err("UDP request timeout".to_string())
    }
}
