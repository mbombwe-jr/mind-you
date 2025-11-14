use libp2p::{
  NetworkBehaviour,
  mdns::{Mdns,MdnsEvent,MdnsConfig},
  floodsub::{Floodsub,FloodsubEvent},
  PeerId
};
use std::result::Result;

/// A combined NetworkBehaviour that supports both MDNS and Floodsub
#[derive(NetworkBehaviour)]
#[behaviour(out_event = "BehaviourEvent", event_process = false)]
pub struct Behaviour {
  pub mdns: Mdns,
  pub floodsub: Floodsub,
}

impl Behaviour {
  pub async fn new(peer_id: PeerId) -> Result<Self, String> {
    let mdns = Mdns::new(MdnsConfig::default())
      .await
      .map_err(|e| format!("Failed to initialize mDNS: {}", e))?;
    
    Ok(Self {
      mdns,
      floodsub: Floodsub::new(peer_id)
    })
  }
}

/// The custom NetworkEvent emits these events
#[derive(Debug)]
pub enum BehaviourEvent {
  MdnsEvent(MdnsEvent),
  FloodsubEvent(FloodsubEvent),
}

impl From<MdnsEvent> for BehaviourEvent {
  fn from(event: MdnsEvent) -> Self {
    BehaviourEvent::MdnsEvent(event)
  }
}
impl From<FloodsubEvent> for BehaviourEvent {
  fn from(event: FloodsubEvent) -> Self {
    BehaviourEvent::FloodsubEvent(event)
  }
}
