use api_gateway::{AppConfig, NacosServiceDiscovery, HttpProxy, WebSocketProxy, SseProxy};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::sync::Arc;
use tracing::{error, info};
use tracing_subscriber;

#[derive(Parser)]
#[command(name = "api-gateway")]
#[command(about = "Rust API Gateway with Nacos support", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Start {
        #[arg(short, long, default_value = "config.yaml")]
        config: String,
    },
    Init {
        #[arg(short, long)]
        name: String,
        #[arg(short, long)]
        namespace: Option<String>,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Start { config } => {
            start_gateway(config).await?;
        }
        Commands::Init { name, namespace } => {
            info!("Initializing service {} in namespace {:?}", name, namespace);
        }
    }

    Ok(())
}

async fn start_gateway(config_path: String) -> Result<()> {
    let config = load_config(&config_path)?;
    
    info!("Starting API Gateway...");
    info!("Server: {}:{}", config.server.host, config.server.port);
    info!("Nacos: {}", config.nacos.server_addr);
    info!("Routes: {}", config.routes.len());

    let nacos = Arc::new(NacosServiceDiscovery::new(config.nacos.clone()));
    nacos.start().await?;

    let http_proxy = HttpProxy::new(nacos.clone(), config.routes.clone());
    let _ws_proxy = WebSocketProxy::new(nacos.clone(), config.routes.clone());
    let _sse_proxy = SseProxy::new(nacos.clone(), config.routes.clone());

    let _handles = http_proxy.start()?;
    _ws_proxy.start().await?;
    _sse_proxy.start().await?;

    info!("API Gateway started successfully");
    info!("HTTP proxy: {}:{}", config.server.host, config.server.port);
    info!("WebSocket proxy: {}:8081", config.server.host);
    info!("SSE proxy: {}:8082", config.server.host);

    tokio::signal::ctrl_c().await?;
    
    info!("Shutting down API Gateway...");
    _ws_proxy.shutdown().await;
    _sse_proxy.shutdown().await;

    Ok(())
}

fn load_config(path: &str) -> Result<AppConfig> {
    let content = std::fs::read_to_string(path)?;
    let config: AppConfig = serde_yaml::from_str(&content)?;
    Ok(config)
}
