use crate::config::NacosConfig;
use anyhow::Result;
use dashmap::DashMap;
use nacos_sdk::api::service::ServiceInstance;
use nacos_sdk::api::naming::NamingService;
use nacos_sdk::client::naming::NamingClient;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info, warn};

#[derive(Debug, Clone)]
pub struct NacosServiceInstance {
    pub instance_id: String,
    pub ip: String,
    pub port: u16,
    pub weight: f64,
    pub healthy: bool,
    pub metadata: HashMap<String, String>,
}

impl From<ServiceInstance> for NacosServiceInstance {
    fn from(instance: ServiceInstance) -> Self {
        Self {
            instance_id: instance.instance_id,
            ip: instance.ip,
            port: instance.port,
            weight: instance.weight,
            healthy: instance.healthy,
            metadata: instance.metadata,
        }
    }
}

pub struct NacosServiceDiscovery {
    config: NacosConfig,
    naming_client: Arc<RwLock<Option<NamingClient>>>,
    instances: Arc<DashMap<String, Vec<NacosServiceInstance>>>,
}

impl NacosServiceDiscovery {
    pub fn new(config: NacosConfig) -> Self {
        Self {
            config,
            naming_client: Arc::new(RwLock::new(None)),
            instances: Arc::new(DashMap::new()),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Nacos service discovery...");
        
        let properties = nacos_sdk::api::props::Properties::new()
            .server_addr(self.config.server_addr.clone())
            .namespace(self.config.namespace.clone())
            .username(self.config.username.clone())
            .password(self.config.password.clone());

        let client = nacos_sdk::client::naming::NamingClient::new(properties)
            .map_err(|e| anyhow::anyhow!("Failed to create Nacos client: {}", e))?;

        *self.naming_client.write() = Some(client);
        
        info!("Nacos client initialized");
        self.start_background_refresh().await;
        
        Ok(())
    }

    async fn start_background_refresh(&self) {
        let config = self.config.clone();
        let naming_client = self.naming_client.clone();
        let instances = self.instances.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(config.refresh_interval_secs));
            
            loop {
                interval.tick().await;
                
                let client_guard = naming_client.read();
                if let Some(client) = client_guard.as_ref() {
                    if let Err(e) = Self::refresh_instances(client, &config, &instances).await {
                        error!("Failed to refresh Nacos instances: {}", e);
                    }
                }
            }
        });
    }

    async fn refresh_instances(
        client: &NamingClient,
        config: &NacosConfig,
        instances: &DashMap<String, Vec<NacosServiceInstance>>,
    ) -> Result<()> {
        let service_names = vec![
            "service",
            "ai-chat-service",
            "file-conversion",
        ];

        for service_name in service_names {
            match client.select_instances(
                service_name,
                config.group_name.clone(),
                vec![],
                true,
            ).await {
                Ok(instance_list) => {
                    let converted: Vec<NacosServiceInstance> = instance_list
                        .into_iter()
                        .map(NacosServiceInstance::from)
                        .collect();
                    
                    instances.insert(service_name.to_string(), converted.clone());
                    info!("Refreshed {} instances for service: {}", converted.len(), service_name);
                }
                Err(e) => {
                    warn!("Failed to get instances for {}: {}", service_name, e);
                }
            }
        }

        Ok(())
    }

    pub fn get_instances(&self, service_name: &str) -> Vec<NacosServiceInstance> {
        self.instances
            .get(service_name)
            .map(|v| v.clone())
            .unwrap_or_default()
    }

    pub fn select_instance(&self, service_name: &str, strategy: &str) -> Option<NacosServiceInstance> {
        let instances = self.get_instances(service_name);
        if instances.is_empty() {
            return None;
        }

        let healthy_instances: Vec<_> = instances.into_iter()
            .filter(|i| i.healthy)
            .collect();

        if healthy_instances.is_empty() {
            return None;
        }

        match strategy {
            "roundrobin" => Some(healthy_instances[0].clone()),
            "random" => {
                use std::time::{SystemTime, UNIX_EPOCH};
                let seed = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos() as usize;
                Some(healthy_instances[seed % healthy_instances.len()].clone())
            }
            "leastconn" => Some(healthy_instances[0].clone()),
            _ => Some(healthy_instances[0].clone()),
        }
    }
}
