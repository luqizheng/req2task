use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub payload: serde_json::Value,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunnerRegisterPayload {
    pub runner_id: String,
    pub hostname: String,
    pub capabilities: RunnerCapabilities,
    pub system_info: SystemInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunnerCapabilities {
    pub docker_available: bool,
    pub docker_version: Option<String>,
    pub max_containers: usize,
    pub supported_bots: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub ip_address: String,
    pub cpu_count: usize,
    pub memory_total: u64,
    pub disk_total: u64,
    pub docker_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerCreatePayload {
    pub container_id: String,
    pub bot_type: String,
    pub image: String,
    pub ports: Vec<PortMapping>,
    pub env: HashMap<String, String>,
    pub volumes: Vec<VolumeMount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortMapping {
    pub internal: u16,
    pub external: u16,
    pub protocol: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeMount {
    pub host_path: String,
    pub container_path: String,
    pub read_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerStatusPayload {
    pub container_id: String,
    pub status: ContainerStatus,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContainerStatus {
    Created,
    Running,
    Paused,
    Restarting,
    Removing,
    Exited,
    Dead,
    NotFound,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatPayload {
    pub runner_id: String,
    pub status: String,
    pub containers: Vec<ContainerInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerInfo {
    pub container_id: String,
    pub bot_type: String,
    pub status: String,
    pub ports: Vec<PortMapping>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPayload {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

impl WebSocketMessage {
    pub fn new(msg_type: &str, payload: impl Serialize) -> Self {
        Self {
            msg_type: msg_type.to_string(),
            payload: serde_json::to_value(payload).unwrap_or_default(),
            timestamp: chrono_lite(),
        }
    }
}

fn chrono_lite() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}
