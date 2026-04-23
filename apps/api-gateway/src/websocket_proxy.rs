use crate::config::{Protocol, RouteConfig};
use crate::nacos::NacosServiceDiscovery;
use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use hyper_util::rt::TokioIo;
use parking_lot::RwLock;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tracing::{error, info};

pub struct WebSocketProxy {
    nacos: Arc<NacosServiceDiscovery>,
    routes: Arc<RwLock<Vec<RouteConfig>>>,
    shutdown_tx: Arc<RwLock<Option<broadcast::Sender<()>>>>,
}

impl WebSocketProxy {
    pub fn new(nacos: Arc<NacosServiceDiscovery>, routes: Vec<RouteConfig>) -> Self {
        Self {
            nacos,
            routes: Arc::new(RwLock::new(routes)),
            shutdown_tx: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn start(&self) -> Result<()> {
        let (shutdown_tx, _) = broadcast::channel::<()>(1);
        *self.shutdown_tx.write() = Some(shutdown_tx.clone());

        let routes = self.routes.read().clone();
        let nacos = self.nacos.clone();
        let shutdown = shutdown_tx.subscribe();

        tokio::spawn(async move {
            Self::run_websocket_server(routes, nacos, shutdown).await;
        });

        Ok(())
    }

    async fn run_websocket_server(
        routes: Vec<RouteConfig>,
        nacos: Arc<NacosServiceDiscovery>,
        mut shutdown_rx: broadcast::Receiver<()>,
    ) {
        let ws_routes: Vec<_> = routes.into_iter()
            .filter(|r| r.protocol == Protocol::WebSocket)
            .collect();

        if ws_routes.is_empty() {
            info!("No WebSocket routes configured");
            return;
        }

        let mut handles = vec![];

        for route in ws_routes {
            let nacos_clone = nacos.clone();
            let shutdown_clone = shutdown_rx.resubscribe();

            let handle = tokio::spawn(async move {
                let addr = format!("0.0.0.0:{}", 8081);
                let listener = TcpListener::bind(&addr).await
                    .expect(&format!("Failed to bind to {}", addr));
                
                info!("WebSocket proxy listening on {}", addr);

                loop {
                    tokio::select! {
                        result = listener.accept() => {
                            match result {
                                Ok((stream, client_addr)) => {
                                    let nacos = nacos_clone.clone();
                                    let route = route.clone();
                                    
                                    tokio::spawn(async move {
                                        if let Err(e) = Self::handle_websocket(stream, client_addr, nacos, route).await {
                                            error!("WebSocket handler error: {}", e);
                                        }
                                    });
                                }
                                Err(e) => {
                                    error!("Failed to accept WebSocket connection: {}", e);
                                }
                            }
                        }
                        _ = shutdown_clone.recv() => {
                            info!("WebSocket server shutting down");
                            break;
                        }
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            let _ = handle.await;
        }
    }

    async fn handle_websocket(
        stream: tokio::net::TcpStream,
        client_addr: SocketAddr,
        nacos: Arc<NacosServiceDiscovery>,
        route: RouteConfig,
    ) -> Result<()> {
        info!("New WebSocket connection from {}", client_addr);

        let instance = nacos.select_instance(&route.service_name, "roundrobin")
            .ok_or_else(|| anyhow::anyhow!("No available backend for service"))?;

        let upstream_addr = format!("{}:{}", instance.ip, instance.port);
        info!("Proxying WebSocket to {}", upstream_addr);

        let stream = TokioIo::new(stream);
        let mut ws_stream = tokio_tungstenite::accept_async(stream).await?;

        let (mut upstream_ws, _) = tokio_tungstenite::connect_async(&format!("ws://{}", upstream_addr)).await?;
        
        let (client_tx, mut client_rx) = ws_stream.split();
        let (upstream_tx, mut upstream_rx) = upstream_ws.split();

        let client_to_upstream = async {
            while let Some(msg) = client_rx.next().await {
                match msg {
                    Ok(msg) => {
                        if upstream_tx.send(msg).await.is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        error!("Client message error: {}", e);
                        break;
                    }
                }
            }
        };

        let upstream_to_client = async {
            while let Some(msg) = upstream_rx.next().await {
                match msg {
                    Ok(msg) => {
                        if client_tx.send(msg).await.is_err() {
                            break;
                        }
                    }
                    Err(e) => {
                        error!("Upstream message error: {}", e);
                        break;
                    }
                }
            }
        };

        tokio::select! {
            _ = client_to_upstream => {}
            _ = upstream_to_client => {}
        }

        info!("WebSocket connection closed");
        Ok(())
    }

    pub async fn shutdown(&self) {
        if let Some(tx) = self.shutdown_tx.write().take() {
            let _ = tx.send(());
        }
    }
}
