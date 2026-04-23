use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub nacos: NacosConfig,
    pub routes: Vec<RouteConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub worker_threads: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NacosConfig {
    pub server_addr: String,
    pub namespace: String,
    pub username: String,
    pub password: String,
    pub cluster_name: String,
    pub group_name: String,
    pub refresh_interval_secs: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RouteConfig {
    pub path: String,
    pub protocol: Protocol,
    pub service_name: String,
    pub load_balance: LoadBalance,
    pub timeout_secs: u64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Protocol {
    Http,
    WebSocket,
    Sse,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LoadBalance {
    RoundRobin,
    Random,
    LeastConn,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
                worker_threads: 4,
            },
            nacos: NacosConfig {
                server_addr: "127.0.0.1:8848".to_string(),
                namespace: "public".to_string(),
                username: "nacos".to_string(),
                password: "nacos".to_string(),
                cluster_name: "DEFAULT".to_string(),
                group_name: "DEFAULT_GROUP".to_string(),
                refresh_interval_secs: 30,
            },
            routes: vec![],
        }
    }
}
