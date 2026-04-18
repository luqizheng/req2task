use anyhow::Result;
use parking_lot::RwLock;
use std::collections::HashMap;
use sysinfo::System;
use tracing::{debug, info};

use crate::config::RunnerConfig;
use crate::docker::DockerManager;
use crate::port::PortAllocator;
use crate::types::{
    ContainerCreatePayload, ContainerInfo, ContainerStatus, PortMapping, RunnerCapabilities,
    RunnerRegisterPayload, SystemInfo,
};

pub struct Runner {
    config: RunnerConfig,
    docker: DockerManager,
    port_allocator: PortAllocator,
    containers: RwLock<HashMap<String, ManagedContainer>>,
}

struct ManagedContainer {
    bot_type: String,
    image: String,
    status: ContainerStatus,
    ports: Vec<PortMapping>,
}

impl Runner {
    pub fn new(config: RunnerConfig, docker: DockerManager, port_allocator: PortAllocator) -> Self {
        Self {
            config,
            docker,
            port_allocator,
            containers: RwLock::new(HashMap::new()),
        }
    }

    pub fn get_runner_id(&self) -> &str {
        &self.config.id
    }

    pub fn get_token(&self) -> &str {
        &self.config.token
    }

    pub async fn get_registration_info(&self) -> Result<RunnerRegisterPayload> {
        let capabilities = self.get_capabilities().await;
        let system_info = self.get_system_info();

        Ok(RunnerRegisterPayload {
            runner_id: self.config.id.clone(),
            hostname: hostname::get()
                .map(|h| h.to_string_lossy().to_string())
                .unwrap_or_else(|_| "unknown".to_string()),
            capabilities,
            system_info,
        })
    }

    pub async fn get_capabilities(&self) -> RunnerCapabilities {
        let docker_available = self.docker.is_available().await;
        let docker_version = self.docker.get_version().await;

        RunnerCapabilities {
            docker_available,
            docker_version,
            max_containers: self.config.max_containers,
            supported_bots: vec![
                "docker-developer".to_string(),
                "python-developer".to_string(),
                "rust-developer".to_string(),
            ],
        }
    }

    pub fn get_system_info(&self) -> SystemInfo {
        let mut sys = System::new_all();
        sys.refresh_all();

        SystemInfo {
            os: System::name().unwrap_or_else(|| "Linux".to_string()),
            os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
            arch: std::env::consts::ARCH.to_string(),
            ip_address: get_local_ip().unwrap_or_else(|| "127.0.0.1".to_string()),
            cpu_count: sys.cpus().len(),
            memory_total: sys.total_memory(),
            disk_total: sys
                .disks()
                .iter()
                .map(|d| d.total_space())
                .sum(),
            docker_version: None,
        }
    }

    pub async fn create_container(&self, payload: ContainerCreatePayload) -> Result<ContainerInfo> {
        debug!("Creating container: {}", payload.container_id);

        let ports: Vec<u16> = payload.ports.iter().map(|p| p.internal).collect();
        let ports_for_alloc = if ports.is_empty() {
            vec![3000, 3001]
        } else {
            ports
        };

        let allocated_ports = self.port_allocator.allocate(ports_for_alloc.len())?;

        let mut port_mappings = Vec::new();
        for (i, internal) in ports_for_alloc.iter().enumerate() {
            port_mappings.push(PortMapping {
                internal: *internal,
                external: allocated_ports[i],
                protocol: "tcp".to_string(),
            });
        }

        let env = {
            let mut e = payload.env.clone();
            e.insert("CONTAINER_ID".to_string(), payload.container_id.clone());
            e.insert("BOT_TYPE".to_string(), payload.bot_type.clone());
            e.insert("RUNNER_ID".to_string(), self.config.id.clone());
            e
        };

        let container_id = self
            .docker
            .create_container(
                &payload.container_id,
                &payload.image,
                &allocated_ports,
                &env,
                &payload.volumes,
            )
            .await?;

        let managed = ManagedContainer {
            bot_type: payload.bot_type.clone(),
            image: payload.image.clone(),
            status: ContainerStatus::Created,
            ports: port_mappings.clone(),
        };

        {
            let mut containers = self.containers.write();
            containers.insert(container_id.clone(), managed);
        }

        Ok(ContainerInfo {
            container_id,
            bot_type: payload.bot_type,
            status: "created".to_string(),
            ports: port_mappings,
        })
    }

    pub async fn start_container(&self, container_id: &str) -> Result<ContainerInfo> {
        debug!("Starting container: {}", container_id);

        self.docker.start_container(container_id).await?;

        {
            let mut containers = self.containers.write();
            if let Some(container) = containers.get_mut(container_id) {
                container.status = ContainerStatus::Running;
            }
        }

        self.get_container_info(container_id).await
    }

    pub async fn stop_container(&self, container_id: &str) -> Result<()> {
        debug!("Stopping container: {}", container_id);
        self.docker.stop_container(container_id).await?;

        {
            let mut containers = self.containers.write();
            if let Some(container) = containers.get_mut(container_id) {
                container.status = ContainerStatus::Exited;
            }
        }

        Ok(())
    }

    pub async fn remove_container(&self, container_id: &str) -> Result<()> {
        debug!("Removing container: {}", container_id);

        self.docker.remove_container(container_id).await?;

        let ports: Vec<u16> = {
            let containers = self.containers.read();
            containers
                .get(container_id)
                .map(|c| c.ports.iter().map(|p| p.external).collect())
                .unwrap_or_default()
        };

        {
            let mut containers = self.containers.write();
            containers.remove(container_id);
        }

        self.port_allocator.release_all(&ports);

        Ok(())
    }

    pub async fn get_container_info(&self, container_id: &str) -> Result<ContainerInfo> {
        let containers = self.containers.read();

        if let Some(container) = containers.get(container_id) {
            let status = self.docker.get_container_status(container_id).await?;

            Ok(ContainerInfo {
                container_id: container_id.to_string(),
                bot_type: container.bot_type.clone(),
                status: format!("{:?}", status).to_lowercase(),
                ports: container.ports.clone(),
            })
        } else {
            Err(anyhow::anyhow!("Container {} not found", container_id))
        }
    }

    pub fn get_all_containers(&self) -> Vec<ContainerInfo> {
        let containers = self.containers.read();
        containers
            .values()
            .map(|c| ContainerInfo {
                container_id: String::new(),
                bot_type: c.bot_type.clone(),
                status: format!("{:?}", c.status).to_lowercase(),
                ports: c.ports.clone(),
            })
            .collect()
    }

    pub fn get_container_count(&self) -> usize {
        let containers = self.containers.read();
        containers.len()
    }
}

fn get_local_ip() -> Option<String> {
    use std::net::{IpAddr, Ipv4Addr, UdpSocket};

    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;

    match socket.local_addr() {
        Ok(addr) => Some(addr.ip().to_string()),
        Err(_) => Some("127.0.0.1".to_string()),
    }
}

impl Clone for Runner {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            docker: self.docker.clone(),
            port_allocator: self.port_allocator.clone(),
            containers: RwLock::new(HashMap::new()),
        }
    }
}
