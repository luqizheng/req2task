use anyhow::{bail, Context, Result};
use std::collections::HashMap;
use std::process::Command;
use tracing::{debug, error, info, warn};

use crate::types::{ContainerInfo, ContainerStatus, PortMapping, VolumeMount};

pub struct DockerManager {
    registry: String,
}

impl DockerManager {
    pub fn new(config: &crate::config::DockerConfig) -> Result<Self> {
        Ok(Self {
            registry: config.registry.clone(),
        })
    }

    pub async fn is_available(&self) -> bool {
        Command::new("docker")
            .args(["info"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    pub async fn get_version(&self) -> Option<String> {
        Command::new("docker")
            .args(["version", "--format", "{{.Server.Version}}"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
    }

    pub async fn pull_image(&self, image: &str) -> Result<()> {
        let full_image = if !image.contains('/') {
            format!("{}/library/{}", self.registry, image)
        } else {
            image.to_string()
        };

        info!("Pulling image: {}", full_image);

        let output = Command::new("docker")
            .args(["pull", &full_image])
            .output()
            .context("Failed to execute docker pull")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            bail!("Failed to pull image: {}", stderr);
        }

        Ok(())
    }

    pub async fn run_container(
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

        let mut cmd = Command::new("docker");
        cmd.arg("run")
            .arg("-d")
            .arg("--name")
            .arg(container_id)
            .arg("--restart")
            .arg("always");

        for port in ports {
            cmd.arg("-p").arg(format!("{}:{}", port, port));
        }

        for volume in volumes {
            if volume.read_only {
                cmd.arg("-v")
                    .arg(format!("{}:{}:ro", volume.host_path, volume.container_path));
            } else {
                cmd.arg("-v")
                    .arg(format!("{}:{}", volume.host_path, volume.container_path));
            }
        }

        for (k, v) in env {
            cmd.arg("-e").arg(format!("{}={}", k, v));
        }

        cmd.arg("--memory").arg("2g");
        cmd.arg("--cpus").arg("0.5");

        cmd.arg(&full_image);
        cmd.arg("sleep").arg("infinity");

        debug!("Running: {:?}", cmd);

        let output = cmd
            .output()
            .context("Failed to execute docker run")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            error!("Failed to create container {}: {}", container_id, stderr);
            bail!("Failed to create container: {}", stderr);
        }

        let container_id_output = String::from_utf8_lossy(&output.stdout).trim().to_string();
        info!("Created container {} with ID {}", container_id, container_id_output);

        Ok(container_id_output)
    }

    pub async fn create_container(
        &self,
        container_id: &str,
        image: &str,
        ports: &[u16],
        env: &HashMap<String, String>,
        volumes: &[VolumeMount],
    ) -> Result<String> {
        self.run_container(container_id, image, ports, env, volumes).await
    }

    pub async fn start_container(&self, container_id: &str) -> Result<()> {
        info!("Starting container: {}", container_id);

        let output = Command::new("docker")
            .args(["start", container_id])
            .output()
            .context("Failed to execute docker start")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            bail!("Failed to start container: {}", stderr);
        }

        Ok(())
    }

    pub async fn stop_container(&self, container_id: &str) -> Result<()> {
        info!("Stopping container: {}", container_id);

        let output = Command::new("docker")
            .args(["stop", "-t", "10", container_id])
            .output()
            .context("Failed to execute docker stop")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            bail!("Failed to stop container: {}", stderr);
        }

        Ok(())
    }

    pub async fn remove_container(&self, container_id: &str) -> Result<()> {
        info!("Removing container: {}", container_id);

        let output = Command::new("docker")
            .args(["rm", "-f", container_id])
            .output()
            .context("Failed to execute docker rm")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            bail!("Failed to remove container: {}", stderr);
        }

        Ok(())
    }

    pub async fn get_container_status(&self, container_id: &str) -> Result<ContainerStatus> {
        let output = Command::new("docker")
            .args(["inspect", "--format", "{{.State.Status}}", container_id])
            .output()
            .context("Failed to execute docker inspect")?;

        if !output.status.success() {
            return Ok(ContainerStatus::NotFound);
        }

        let status = String::from_utf8_lossy(&output.stdout).trim().to_string();

        let status = match status.as_str() {
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
        let output = Command::new("docker")
            .args([
                "ps",
                "-a",
                "--format",
                "{{.ID}}|{{.Image}}|{{.State}}|{{.Ports}}|{{.Labels}}",
            ])
            .output()
            .context("Failed to execute docker ps")?;

        if !output.status.success() {
            return Ok(Vec::new());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let containers: Vec<ContainerInfo> = stdout
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 3 {
                    let ports = parse_ports(parts.get(3).unwrap_or(&""));
                    Some(ContainerInfo {
                        container_id: parts[0].to_string(),
                        bot_type: extract_label(parts.get(4).unwrap_or(&""), "bot_type"),
                        status: parts[2].to_string(),
                        ports,
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(containers)
    }

    pub async fn get_container_logs(&self, container_id: &str, tail: usize) -> Result<String> {
        let output = Command::new("docker")
            .args(["logs", "--tail", &tail.to_string(), container_id])
            .output()
            .context("Failed to execute docker logs")?;

        if !output.status.success() {
            warn!("Error reading logs for container {}", container_id);
            return Ok(String::new());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(format!("{}\n{}", stdout, stderr))
    }

    pub async fn get_container_ports(&self, container_id: &str) -> Result<Vec<PortMapping>> {
        let output = Command::new("docker")
            .args(["port", container_id])
            .output()
            .context("Failed to execute docker port")?;

        if !output.status.success() {
            return Ok(Vec::new());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let ports: Vec<PortMapping> = stdout
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split(" -> ").collect();
                if parts.len() == 2 {
                    let host = parts[1];
                    let container = parts[0];
                    let (host_port, protocol) = parse_host_port(host);
                    let container_port: u16 = container.split('/').next()?.parse().ok()?;
                    Some(PortMapping {
                        internal: container_port,
                        external: host_port,
                        protocol,
                    })
                } else {
                    None
                }
            })
            .collect();

        Ok(ports)
    }
}

fn parse_ports(ports_str: &str) -> Vec<PortMapping> {
    ports_str
        .split(',')
        .filter_map(|p| {
            let p = p.trim();
            if p.is_empty() {
                return None;
            }
            let parts: Vec<&str> = p.split(':').collect();
            if parts.len() == 2 {
                let host_port: u16 = parts[0].parse().ok()?;
                let container_part = parts[1];
                let (container_port, protocol) = parse_host_port(container_part);
                Some(PortMapping {
                    internal: container_port,
                    external: host_port,
                    protocol,
                })
            } else if parts.len() == 1 {
                let (port, protocol) = parse_host_port(parts[0]);
                Some(PortMapping {
                    internal: port,
                    external: port,
                    protocol,
                })
            } else {
                None
            }
        })
        .collect()
}

fn parse_host_port(s: &str) -> (u16, String) {
    let parts: Vec<&str> = s.split('/').collect();
    let port: u16 = parts[0].parse().unwrap_or(0);
    let protocol = parts.get(1).unwrap_or(&"tcp").to_string();
    (port, protocol)
}

fn extract_label(labels: &str, key: &str) -> String {
    labels
        .split(',')
        .find(|l| l.starts_with(&format!("{}=", key)))
        .and_then(|l| l.split('=').nth(1))
        .unwrap_or("")
        .to_string()
}

impl Clone for DockerManager {
    fn clone(&self) -> Self {
        Self {
            registry: self.registry.clone(),
        }
    }
}
