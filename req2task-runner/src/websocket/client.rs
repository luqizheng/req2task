use anyhow::{bail, Context, Result};
use futures_util::{SinkExt, StreamExt};
use parking_lot::Mutex;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_native_tls::TlsConnector;
use tokio_tungstenite::{
    connect_async, native_tls::TlsStream, ws_message::Message, MaybeTlsStream, WebSocketStream,
};
use tracing::{debug, error, info, warn};
use tungstenite::protocol::WebSocketConfig;

use crate::runner::Runner;
use crate::types::{
    ContainerCreatePayload, ContainerInfo, ContainerStatusPayload, ErrorPayload,
    HeartbeatPayload, WebSocketMessage,
};

pub struct WsClient {
    url: String,
    runner: Runner,
    sender: Mutex<Option<mpsc::Sender<String>>>,
    reconnect_attempts: AtomicUsize,
    heartbeat_handle: Mutex<Option<tokio::task::JoinHandle<()>>>,
}

impl WsClient {
    pub fn new(url: &str, runner: Runner) -> Self {
        Self {
            url: url.to_string(),
            runner,
            sender: Mutex::new(None),
            reconnect_attempts: AtomicUsize::new(0),
            heartbeat_handle: Mutex::new(None),
        }
    }

    pub async fn connect(&mut self) -> Result<()> {
        info!("Connecting to WebSocket server: {}", self.url);

        let (ws_stream, _) = connect_async(&self.url)
            .await
            .context("Failed to connect to WebSocket server")?;

        info!("Connected to WebSocket server");

        let (mut write, mut read) = ws_stream.split();
        let (tx, mut rx) = mpsc::channel::<String>(100);

        {
            let mut sender = self.sender.lock();
            *sender = Some(tx);
        }

        let runner_id = self.runner.get_runner_id().to_string();
        let register_info = self.runner.get_registration_info().await?;

        let register_msg = WebSocketMessage::new("register", register_info);
        let register_json = serde_json::to_string(&register_msg)?;
        write.send(Message::Text(register_json.into())).await?;

        let mut heartbeat_interval =
            tokio::time::interval(tokio::time::Duration::from_secs(30));

        let heartbeat_runner = self.runner.clone();
        let heartbeat_tx = self.sender.lock().clone();

        let handle = tokio::spawn(async move {
            loop {
                heartbeat_interval.tick().await;

                if let Some(tx) = &heartbeat_tx {
                    let containers = heartbeat_runner.get_all_containers();
                    let heartbeat = HeartbeatPayload {
                        runner_id: runner_id.clone(),
                        status: "online".to_string(),
                        containers,
                    };

                    let msg = WebSocketMessage::new("heartbeat", heartbeat);
                    if let Ok(json) = serde_json::to_string(&msg) {
                        let _ = tx.send(json).await;
                    }
                }
            }
        });

        {
            let mut handle_guard = self.heartbeat_handle.lock();
            *handle_guard = Some(handle);
        }

        let runner_clone = self.runner.clone();
        let sender_clone = self.sender.lock().clone();

        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if write.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
        });

        let runner_for_read = self.runner.clone();
        let sender_for_read = self.sender.lock().clone();

        tokio::spawn(async move {
            while let Some(msg) = read.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        debug!("Received: {}", text);
                        if let Err(e) = Self::handle_message(
                            &text,
                            &runner_for_read,
                            sender_for_read.clone(),
                        )
                        .await
                        {
                            error!("Error handling message: {}", e);
                        }
                    }
                    Ok(Message::Close(_)) => {
                        info!("Connection closed by server");
                        break;
                    }
                    Ok(Message::Ping(data)) => {
                        if let Some(tx) = &sender_clone {
                            let _ = tx
                                .send(serde_json::to_string(&WebSocketMessage::new(
                                    "pong",
                                    serde_json::json!({ "data": data }),
                                ))
                                .unwrap())
                                .await;
                        }
                    }
                    Err(e) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
        });

        self.reconnect_attempts.store(0, Ordering::SeqCst);

        Ok(())
    }

    async fn handle_message(
        text: &str,
        runner: &Runner,
        sender: Option<mpsc::Sender<String>>,
    ) -> Result<()> {
        let msg: WebSocketMessage = serde_json::from_str(text)?;

        match msg.msg_type.as_str() {
            "container.create" => {
                let payload: ContainerCreatePayload = serde_json::from_value(msg.payload)?;
                let result = runner.create_container(payload.clone()).await;

                let response = match result {
                    Ok(info) => WebSocketMessage::new(
                        "container.created",
                        serde_json::json!({
                            "container_id": info.container_id,
                            "ports": info.ports,
                            "status": "created"
                        }),
                    ),
                    Err(e) => WebSocketMessage::new(
                        "error",
                        ErrorPayload {
                            code: "CREATE_FAILED".to_string(),
                            message: e.to_string(),
                            details: None,
                        },
                    ),
                };

                if let Some(tx) = &sender {
                    let _ = tx.send(serde_json::to_string(&response)?).await;
                }
            }
            "container.start" => {
                if let Some(container_id) = msg.payload.get("container_id").and_then(|v| v.as_str())
                {
                    let result = runner.start_container(container_id).await;

                    let response = match result {
                        Ok(info) => WebSocketMessage::new("container.started", info),
                        Err(e) => WebSocketMessage::new(
                            "error",
                            ErrorPayload {
                                code: "START_FAILED".to_string(),
                                message: e.to_string(),
                                details: None,
                            },
                        ),
                    };

                    if let Some(tx) = &sender {
                        let _ = tx.send(serde_json::to_string(&response)?).await;
                    }
                }
            }
            "container.stop" => {
                if let Some(container_id) = msg.payload.get("container_id").and_then(|v| v.as_str())
                {
                    let result = runner.stop_container(container_id).await;

                    let response = match result {
                        Ok(()) => WebSocketMessage::new(
                            "container.stopped",
                            serde_json::json!({ "container_id": container_id }),
                        ),
                        Err(e) => WebSocketMessage::new(
                            "error",
                            ErrorPayload {
                                code: "STOP_FAILED".to_string(),
                                message: e.to_string(),
                                details: None,
                            },
                        ),
                    };

                    if let Some(tx) = &sender {
                        let _ = tx.send(serde_json::to_string(&response)?).await;
                    }
                }
            }
            "container.remove" => {
                if let Some(container_id) = msg.payload.get("container_id").and_then(|v| v.as_str())
                {
                    let result = runner.remove_container(container_id).await;

                    let response = match result {
                        Ok(()) => WebSocketMessage::new(
                            "container.removed",
                            serde_json::json!({ "container_id": container_id }),
                        ),
                        Err(e) => WebSocketMessage::new(
                            "error",
                            ErrorPayload {
                                code: "REMOVE_FAILED".to_string(),
                                message: e.to_string(),
                                details: None,
                            },
                        ),
                    };

                    if let Some(tx) = &sender {
                        let _ = tx.send(serde_json::to_string(&response)?).await;
                    }
                }
            }
            "container.status" => {
                if let Some(container_id) = msg.payload.get("container_id").and_then(|v| v.as_str())
                {
                    let result = runner.get_container_info(container_id).await;

                    let response = match result {
                        Ok(info) => WebSocketMessage::new("container.status", info),
                        Err(e) => WebSocketMessage::new(
                            "error",
                            ErrorPayload {
                                code: "STATUS_FAILED".to_string(),
                                message: e.to_string(),
                                details: None,
                            },
                        ),
                    };

                    if let Some(tx) = &sender {
                        let _ = tx.send(serde_json::to_string(&response)?).await;
                    }
                }
            }
            "runner.status" => {
                let capabilities = runner.get_capabilities().await;
                let containers = runner.get_all_containers();

                let status = serde_json::json!({
                    "runner_id": runner.get_runner_id(),
                    "capabilities": capabilities,
                    "containers": containers,
                    "container_count": runner.get_container_count()
                });

                let response = WebSocketMessage::new("runner.status", status);

                if let Some(tx) = &sender {
                    let _ = tx.send(serde_json::to_string(&response)?).await;
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.msg_type);
            }
        }

        Ok(())
    }

    pub async fn handle_messages(&mut self) {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

            if self.sender.lock().is_none() {
                let attempts = self.reconnect_attempts.load(Ordering::SeqCst);

                if attempts < 10 {
                    info!("Attempting to reconnect (attempt {})", attempts + 1);
                    self.reconnect_attempts.fetch_add(1, Ordering::SeqCst);

                    let delay = (3 * (attempts + 1)).min(300);
                    tokio::time::sleep(tokio::time::Duration::from_secs(delay)).await;

                    if let Err(e) = self.connect().await {
                        error!("Reconnection failed: {}", e);
                    }
                } else {
                    error!("Max reconnection attempts reached, exiting");
                    break;
                }
            }
        }
    }
}
