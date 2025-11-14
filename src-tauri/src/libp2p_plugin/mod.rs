use libp2p::{
  floodsub::{FloodsubEvent, Topic},
  identity,
  mdns::MdnsEvent,
  swarm::SwarmBuilder,
  PeerId,
};
use libp2p::futures::StreamExt;
use serde::Serialize;
use tauri::{plugin::{Builder, TauriPlugin}, Manager, Runtime, State, Emitter};
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};
pub mod behaviour;
pub mod transport;

// Hardcoded chat rooms
const CHAT_ROOMS: &[&str] = &["WELCOME", "GENERAL", "SPORTS"];

/// Extend NodeCommand to include topic (room)
#[derive(Debug)]
enum NodeCommand {
  Message { 
    message: String, 
    #[allow(dead_code)]
    from: String,
    room: String,
  },
}

/// Events the webview can receive from the libp2p thread
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum NodeEvent {
  Message { message: String, from: String, room: String },
  #[allow(dead_code)]
  Rooms { rooms: Vec<String> }, // For listing chat rooms
}

/// List available chat rooms
#[tauri::command]
async fn list_rooms() -> Vec<String> {
  CHAT_ROOMS.iter().map(|s| s.to_string()).collect()
}

/// Broadcast a message to a specific room
#[tauri::command]
async fn broadcast(
  message: String,
  room: Option<String>,
  peer_id: State<'_, PeerId>,
  cmd_tx: State<'_, mpsc::Sender<NodeCommand>>,
) -> Result<(), String> {
  let room = room.unwrap_or_else(|| CHAT_ROOMS[0].to_string());
  if !CHAT_ROOMS.contains(&room.as_str()) {
    return Err("Invalid chat room".into());
  }
  
  cmd_tx
    .send(NodeCommand::Message {
      message,
      from: peer_id.to_base58(),
      room,
    })
    .await
    .map_err(|e| format!("Failed to send command: {}", e))?;
  Ok(())
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("libp2p")
    .invoke_handler(tauri::generate_handler![broadcast, list_rooms])
    .setup(|app, _api| {
      let app_handle = app.clone();
      
      // create the command channel
      let (cmd_tx, mut cmd_rx) = mpsc::channel::<NodeCommand>(100);
      app.manage(cmd_tx);

      // Create a random PeerId.
      let id_keys = identity::Keypair::generate_ed25519();
      let peer_id = PeerId::from(id_keys.public());
      println!("Local peer id: {:?}", peer_id);
      app.manage(peer_id);

      // spawn the libp2p node - errors are handled inside, app will still start
      // Delay initialization slightly to let Tauri finish setup and avoid stack overflow
      tauri::async_runtime::spawn(async move {
        // Small delay to let Tauri finish initialization
        sleep(Duration::from_millis(100)).await;
        
        // Initialize with error handling to prevent crashes
        let transport = match transport::tokio_tcp_noise_mplex(id_keys) {
          Ok(t) => t,
          Err(e) => {
            eprintln!("Failed to create libp2p transport: {}", e);
            return; // Exit gracefully instead of crashing
          }
        };

        let mut behaviour = match behaviour::Behaviour::new(peer_id.clone()).await {
          Ok(b) => b,
          Err(e) => {
            eprintln!("Failed to initialize libp2p behaviour: {}", e);
            return; // Exit gracefully instead of crashing
          }
        };

        // Subscribe to all rooms
        let floodsub_topics: Vec<Topic> = CHAT_ROOMS.iter().map(|r| Topic::new(*r)).collect();
        for topic in &floodsub_topics {
          behaviour.floodsub.subscribe(topic.clone());
        }

        // Use executor that properly spawns tasks to avoid stack overflow
        let mut swarm = SwarmBuilder::new(transport, behaviour, peer_id)
            .executor(Box::new(|fut| {
              // Spawn on the current runtime to avoid recursion
              if let Ok(handle) = tokio::runtime::Handle::try_current() {
                handle.spawn(fut);
              } else {
                // Fallback if no runtime handle available
                std::thread::spawn(move || {
                  tokio::runtime::Runtime::new()
                    .unwrap()
                    .block_on(fut);
                });
              }
            }))
            .build();

        // Try to listen on all interfaces (0.0.0.0) instead of hardcoded IP
        // This will work on any system. If this fails, log and continue without crashing
        match "/ip4/0.0.0.0/tcp/0".parse() {
          Ok(addr) => {
            if let Err(e) = swarm.listen_on(addr) {
              eprintln!("Failed to start libp2p listener: {:?}", e);
              return; // Exit gracefully instead of crashing
            }
          }
          Err(e) => {
            eprintln!("Failed to parse listen address: {}", e);
            return; // Exit gracefully instead of crashing
          }
        }

        // Process events with rate limiting to prevent stack overflow
        let mut event_count = 0u32;
        loop {
          tokio::select! {
            cmd_result = cmd_rx.recv() => {
              match cmd_result {
                Some(NodeCommand::Message { message, room, .. }) => {
                  // Find room/topic
                  if let Some(topic) = floodsub_topics.iter().find(|t| t.id() == &room) {
                    swarm.behaviour_mut().floodsub.publish(topic.clone(), message);
                  }
                }
                None => {
                  // Channel closed, exit gracefully
                  eprintln!("libp2p command channel closed");
                  break;
                }
              }
            }
            event_result = swarm.next() => {
              match event_result {
                Some(libp2p::swarm::SwarmEvent::NewListenAddr { address, .. }) => {
                  // Limit how many addresses we print to avoid flooding
                  if event_count < 10 {
                    println!("p2p listening on {}", address);
                  }
                  event_count = event_count.wrapping_add(1);
                  // Yield after every event to prevent stack buildup
                  tokio::task::yield_now().await;
                }
                Some(libp2p::swarm::SwarmEvent::Behaviour(behaviour::BehaviourEvent::MdnsEvent(MdnsEvent::Discovered(peers)))) => {
                  for (peer, _) in peers {
                    swarm.behaviour_mut().floodsub.add_node_to_partial_view(peer);
                  }
                  tokio::task::yield_now().await;
                }
                Some(libp2p::swarm::SwarmEvent::Behaviour(behaviour::BehaviourEvent::MdnsEvent(MdnsEvent::Expired(expired)))) => {
                  for (peer, _) in expired {
                    swarm.behaviour_mut().floodsub.remove_node_from_partial_view(&peer);
                  }
                  tokio::task::yield_now().await;
                }
                Some(libp2p::swarm::SwarmEvent::Behaviour(behaviour::BehaviourEvent::FloodsubEvent(FloodsubEvent::Message(message)))) => {
                  let from = message.source.to_base58();
                  let message_str = String::from_utf8_lossy(&message.data).into_owned();
                  let topic = message.topics.get(0).map(|t| t.id().to_string()).unwrap_or_default();
                  // Spawn to separate task to avoid blocking and stack buildup
                  let app_handle_clone = app_handle.clone();
                  let event = NodeEvent::Message{ message: message_str, from, room: topic };
                  tokio::spawn(async move {
                    let _ = app_handle_clone.emit("plugin:libp2p:message", event);
                  });
                  tokio::task::yield_now().await;
                }
                Some(_) => {
                  // Other events - yield to prevent stack buildup
                  tokio::task::yield_now().await;
                }
                None => {
                  // Stream ended, exit gracefully
                  eprintln!("libp2p swarm stream ended");
                  break;
                }
              }
              // Additional delay to prevent rapid event processing from causing stack overflow
              sleep(Duration::from_millis(5)).await;
            }
          }
        }
      });
      
      Ok(())
    })
    .build()
}