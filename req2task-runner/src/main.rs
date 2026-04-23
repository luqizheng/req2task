mod config;
mod docker;
mod port;
mod runner;
mod types;
mod websocket;

use anyhow::Result;
use tracing::{error, info};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::config::Config;
use crate::docker::DockerManager;
use crate::port::PortAllocator;
use crate::runner::Runner;
use crate::websocket::WsClient;

#[tokio::main]
async fn main() -> Result<()> {
    let config = Config::load()?;

    init_logging(&config)?;

    info!("Starting req2task-runner v{}", env!("CARGO_PKG_VERSION"));
    info!("Runner ID: {}", config.runner.id);

    let port_allocator = PortAllocator::new(config.port.base, config.port.range_start, config.port.range_end);
    let docker_manager = DockerManager::new(&config.docker)?;
    let mut runner = Runner::new(config.runner.clone(), docker_manager.clone(), port_allocator);

    let ws_url = config.websocket.url.clone();
    let mut ws_client = WsClient::new(&ws_url, runner.clone()).await?;

    ws_client.connect().await?;

    ws_client.handle_messages().await;

    Ok(())
}

fn init_logging(config: &Config) -> Result<()> {
    let log_dir = std::path::Path::new(&config.log.path);
    std::fs::create_dir_all(log_dir)?;

    let file_appender = RollingFileAppender::new(Rotation::DAILY, log_dir, "req2task-runner.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    std::mem::forget(_guard);

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&config.log.level));

    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().with_writer(non_blocking))
        .with(fmt::layer().with_writer(std::io::stdout))
        .init();

    Ok(())
}
