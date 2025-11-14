#![cfg_attr(all(target_os = "windows"), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::ExitCode;

use clap::Parser;
use log::{error, info};
use network::{launch, Args, NodeCmd};

#[cfg(feature = "mimalloc")]
#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[derive(Parser)]
#[command(
    name = "network",
    about = "Fubuki Node - Standalone client to connect to Fubuki servers",
    version
)]
struct NodeArgs {
    /// Configuration file path for the node
    #[arg(short, long, default_value = "cfg-example/node-conf.json")]
    config: PathBuf,
}

fn main() -> ExitCode {
    human_panic::setup_panic!();

    let args = NodeArgs::parse();
    
    info!("Starting Fubuki Node");
    info!("Configuration file: {}", args.config.display());

    match launch(Args::Node {
        cmd: NodeCmd::Daemon {
            config_path: args.config.clone(),
        },
    }) {
        Ok(_) => {
            info!("Fubuki Node stopped successfully");
            ExitCode::SUCCESS
        }
        Err(e) => {
            error!("Fubuki Node failed: {:?}", e);
            eprintln!("{:?}", e);
            ExitCode::FAILURE
        }
    }
}

