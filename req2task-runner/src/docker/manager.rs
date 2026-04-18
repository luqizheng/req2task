use anyhow::{bail, Context, Result};
use bollard::container::{
    Config, CreateContainerOptions, ListContainersOptions, LogsOptions, RemoveContainerOptions,
    StartContainerOptions, StopContainerOptions,
};
use bollard::image::{CreateImageOptions, ListImagesOptions};
use bollard::Docker;
use futures_util::StreamExt;
use std::collections::HashMap;
use tracing::{debug, error, info, warn};

use crate::types::{ContainerInfo, ContainerStatus, PortMapping, VolumeMount};

pub struct DockerManager {
    docker: Docker,
    registry: String,
    pull_timeout: u64,
}

impl DockerManager {
    pub fn new(config: &crate::config::DockerConfig) -> Result<Self> {
        let docker = if config.host.starts_with("unix://") {
            Docker::connect_with_unix(&config.host)
        } else if config.host.starts_with("tcp://") {
            Docker::connect_with_tcp(&config.host)
        } else {
            Docker::connect_with_local_defaults()
        }
        .context("Failed to connect to Docker")?;

        Ok(Self {
            docker,
            registry: config.registry.clone(),
            pull_timeout: config.image_pull_timeout,
        })
    }

    pub async fn is_available(&self) -> bool {
        self.docker.ping().await.is_ok()
    }

    pub async fn get_version(&self) -> Option<String> {
        self.docker.version().await.ok().map(|v| v.version)
    }

    pub async fn pull_image(&self, image: &str) -> Result<()> {
        let full_image = if !image.contains('/') {
            format!("{}/library/{}", self.registry, image)
        } else {
            image.to_string()
        };

        info!("Pulling image: {}", full_image);

        self.docker
            .create_image(
                Some(CreateImageOptions {
                    from_image: &full_image,
                    ..Default::default()
                }),
                None,
                None,
            )
            .then(|result| async move {
                match result {
                    Ok(info) => {
                        for item in info {
                            if let Some(status) = item.status {
                                debug!("Pull progress: {}", status);
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to pull image: {}", e);
                    }
                }
                futures_util::future::ready(())
            })
            .collect::<()>()
            .await;

        Ok(())
    }

    pub async fn create_container(
        &self,
        container_id: &str,
        image: &str,
        ports: &[u16],
        env: &HashMap<String, String>,
        volumes: &[VolumeMount],
    ) -> Result<String> {
        let full_image = if !image.contains('/') && !image.contains(':') {
            format!("{}:latest", image)
        } else {
            image.to_string()
        };

        let mut port_bindings = HashMap::new();
        let mut exposed_ports = HashMap::new();

        for (i, port) in ports.iter().enumerate() {
            let container_port = format!("{}/tcp", port);
            let host_port = port + (i as u16 * 1000);

            exposed_ports.insert(container_port.clone(), HashMap::new());
            port_bindings.insert(
                container_port,
                Some(vec![bollard::service::PortBinding {
                    host_ip: Some("0.0.0.0".to_string()),
                    host_port: Some(host_port.to_string()),
                }]),
            );
        }

        let binds: Vec<String> = volumes
            .iter()
            .map(|v| {
                if v.read_only {
                    format!("{}:{}:ro", v.host_path, v.container_path)
                } else {
                    format!("{}:{}", v.host_path, v.container_path)
                }
            })
            .collect();

        let env_vec: Vec<String> = env
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect();

        let host_config = bollard::service::HostConfig {
            port_bindings: Some(port_bindings),
            binds: Some(binds),
            restart_policy: Some(bollard::service::RestartPolicy {
                name: Some(bollard::service::RestartPolicyNameEnum::ALWAYS),
                ..Default::default()
            }),
            memory: Some(2 * 1024 * 1024 * 1024),
            cpu_period: Some(100000),
            cpu_quota: Some(50000),
            ..Default::default()
        };

        let config = Config {
            image: Some(&full_image),
            env: Some(&env_vec),
            exposed_ports: Some(exposed_ports),
            host_config: Some(host_config),
            cmd: Some(vec!["sleep", "infinity"]),
            ..Default::default()
        };

        let options = CreateContainerOptions {
            name: container_id,
            platform: Some("linux/amd64"),
            ..Default::default()
        };

        let response = self.docker.create_container(Some(options), config).await;

        match response {
            Ok(r) => {
                info!("Created container {} with ID {}", container_id, r.id);
                Ok(r.id)
            }
            Err(e) => {
                error!("Failed to create container {}: {}", container_id, e);
                bail!("Failed to create container: {}", e)
            }
        }
    }

    pub async fn start_container(&self, container_id: &str) -> Result<()> {
        info!("Starting container: {}", container_id);
        self.docker
            .start_container(container_id, None::<StartContainerOptions<String>>)
            .await
            .context("Failed to start container")?;
        Ok(())
    }

    pub async fn stop_container(&self, container_id: &str) -> Result<()> {
        info!("Stopping container: {}", container_id);
        self.docker
            .stop_container(container_id, Some(StopContainerOptions { t: 10 }))
            .await
            .context("Failed to stop container")?;
        Ok(())
    }

    pub async fn remove_container(&self, container_id: &str) -> Result<()> {
        info!("Removing container: {}", container_id);
        self.docker
            .remove_container(
                container_id,
                Some(RemoveContainerOptions {
                    force: true,
                    ..Default::default()
                }),
            )
            .await
            .context("Failed to remove container")?;
        Ok(())
    }

    pub async fn get_container_status(&self, container_id: &str) -> Result<ContainerStatus> {
        use bollard::container::InspectContainerOptions;

        let info = self
            .docker
            .inspect_container(container_id, Some(InspectContainerOptions::default()))
            .await?;

        let state = info.state.and_then(|s| s.status).unwrap_or_default();

        let status = match state.as_str() {
            "created" => ContainerStatus::Created,
            "running" => ContainerStatus::Running,
            "paused" => ContainerStatus::Paused,
            "restarting" => ContainerStatus::Restarting,
            "removing" => ContainerStatus::Removing,
            "exited" => ContainerStatus::Exited,
            "dead" => ContainerStatus::Dead,
            _ => ContainerStatus::NotFound,
        };

        Ok(status)
    }

    pub async fn list_containers(&self) -> Result<Vec<ContainerInfo>> {
        let options = ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        };

        let containers = self.docker.list_containers(Some(options)).await?;

        Ok(containers
            .into_iter()
            .map(|c| {
                let ports = c
                    .ports
                    .unwrap_or_default()
                    .into_iter()
                    .map(|p| PortMapping {
                        internal: p.private_port,
                        external: p.public_port.unwrap_or(0),
                        protocol: p.typ.map(|t| t.to_string()).unwrap_or_default(),
                    })
                    .collect();

                ContainerInfo {
                    container_id: c.id.unwrap_or_default(),
                    bot_type: c
                        .labels
                        .and_then(|l| l.get("bot_type").cloned())
                        .unwrap_or_default(),
                    status: c.state.unwrap_or_default(),
                    ports,
                }
            })
            .collect())
    }

    pub async fn get_container_logs(&self, container_id: &str, tail: usize) -> Result<String> {
        let options = LogsOptions::<String> {
            stdout: true,
            stderr: true,
            tail: tail.to_string(),
            ..Default::default()
        };

        let mut logs = self.docker.logs(container_id, Some(options));
        let mut output = String::new();

        while let Some(result) = logs.next().await {
            match result {
                Ok(log) => output.push_str(&log.to_string()),
                Err(e) => {
                    warn!("Error reading logs: {}", e);
                    break;
                }
            }
        }

        Ok(output)
    }
}

impl Clone for DockerManager {
    fn clone(&self) -> Self {
        Self {
            docker: self.docker.clone(),
            registry: self.registry.clone(),
            pull_timeout: self.pull_timeout,
        }
    }
}
