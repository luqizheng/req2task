use anyhow::{Context, Result};
use serde::Deserialize;
use std::fs;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub runner: RunnerConfig,
    pub websocket: WebSocketConfig,
    pub docker: DockerConfig,
    pub port: PortConfig,
    pub log: LogConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RunnerConfig {
    pub id: String,
    pub token: String,
    pub max_containers: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct WebSocketConfig {
    pub url: String,
    pub reconnect_interval: u64,
    pub max_reconnect_attempts: usize,
    pub heartbeat_interval: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DockerConfig {
    pub host: String,
    pub registry: String,
    pub image_pull_timeout: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct PortConfig {
    pub base: u16,
    pub range_start: u16,
    pub range_end: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LogConfig {
    pub level: String,
    pub path: String,
}

impl Config {
    pub fn load() -> Result<Self> {
        let config_path = std::env::var("CONFIG_PATH").unwrap_or_else(|_| "config.yaml".to_string());

        let config_content = fs::read_to_string(&config_path)
            .with_context(|| format!("Failed to read config from {}", config_path))?;

        let mut config: Config = serde_yaml::from_str(&config_content)
            .context("Failed to parse config")?;

        config.apply_env_overrides();

        Ok(config)
    }

    fn apply_env_overrides(&mut self) {
        if let Ok(id) = std::env::var("RUNNER_ID") {
            self.runner.id = id;
        }
        if let Ok(token) = std::env::var("RUNNER_TOKEN") {
            self.runner.token = token;
        }
        if let Ok(url) = std::env::var("WS_URL") {
            self.websocket.url = url;
        }
        if let Ok(host) = std::env::var("DOCKER_HOST") {
            self.docker.host = host;
        }
        if let Ok(level) = std::env::var("RUST_LOG") {
            self.log.level = level;
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            runner: RunnerConfig {
                id: format!("runner-{}", uuid::Uuid::new_v4()),
                token: std::env::var("RUNNER_TOKEN").unwrap_or_default(),
                max_containers: 10,
            },
            websocket: WebSocketConfig {
                url: std::env::var("WS_URL")
                    .unwrap_or_else(|_| "ws://localhost:8765/runner".to_string()),
                reconnect_interval: 3000,
                max_reconnect_attempts: 10,
                heartbeat_interval: 30000,
            },
            docker: DockerConfig {
                host: std::env::var("DOCKER_HOST")
                    .unwrap_or_else(|_| "unix:///var/run/docker.sock".to_string()),
                registry: "zhcoder-docker-registry.com:8000".to_string(),
                image_pull_timeout: 300,
            },
            port: PortConfig {
                base: 8080,
                range_start: 8080,
                range_end: 8990,
            },
            log: LogConfig {
                level: std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
                path: "/var/log/req2task-runner".to_string(),
            },
        }
    }
}
