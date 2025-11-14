use anyhow::Result;
use crate::common::cipher::CipherEnum;
use crate::{ServerConfigFinalize, ServerInfoType};

pub async fn start(_config: ServerConfigFinalize<CipherEnum>) -> Result<()> {
    // Server functionality not implemented
    // This is a stub for the server module
    Err(anyhow::anyhow!("Server functionality is not available"))
}

pub async fn info(_api: &str, _info_type: ServerInfoType) -> Result<()> {
    // Server functionality not implemented
    // This is a stub for the server module
    Err(anyhow::anyhow!("Server functionality is not available"))
}

