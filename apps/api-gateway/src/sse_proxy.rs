use crate::config::{Protocol, RouteConfig};
use crate::nacos::NacosServiceDiscovery;
use anyhow::Result;
use futures_util::StreamExt;
use parking_lot::RwLock;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use tracing::{error, info};

pub struct SseProxy {
    nacos: Arc<NacosServiceDiscovery>,
    routes: Arc<RwLock<Vec<RouteConfig>>>,
    shutdown_tx: Arc<RwLock<Option<broadcast::Sender<()>>>>,
}

impl SseProxy {
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
            Self::run_sse_server(routes, nacos, shutdown).await;
        });

        Ok(())
    }

    async fn run_sse_server(
        routes: Vec<RouteConfig>,
        nacos: Arc<NacosServiceDiscovery>,
        mut shutdown_rx: broadcast::Receiver<()>,
    ) {
        let sse_routes: Vec<_> = routes.into_iter()
            .filter(|r| r.protocol == Protocol::Sse)
            .collect();

        if sse_routes.is_empty() {
            info!("No SSE routes configured");
            return;
        }

        let mut handles = vec![];

        for route in sse_routes {
            let nacos_clone = nacos.clone();
            let shutdown_clone = shutdown_rx.resubscribe();

            let handle = tokio::spawn(async move {
                let addr = format!("0.0.0.0:{}", 8082);
                let listener = TcpListener::bind(&addr).await
                    .expect(&format!("Failed to bind to {}", addr));
                
                info!("SSE proxy listening on {}", addr);

                loop {
                    tokio::select! {
                        result = listener.accept() => {
                            match result {
                                Ok((stream, client_addr)) => {
                                    let nacos = nacos_clone.clone();
                                    let route = route.clone();
                                    
                                    tokio::spawn(async move {
                                        if let Err(e) = Self::handle_sse(stream, client_addr, nacos, route).await {
                                            error!("SSE handler error: {}", e);
                                        }
                                    });
                                }
                                Err(e) => {
                                    error!("Failed to accept SSE connection: {}", e);
                                }
                            }
                        }
                        _ = shutdown_clone.recv() => {
                            info!("SSE server shutting down");
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

    async fn handle_sse(
        stream: tokio::net::TcpStream,
        client_addr: SocketAddr,
        nacos: Arc<NacosServiceDiscovery>,
        route: RouteConfig,
    ) -> Result<()> {
        info!("New SSE connection from {}", client_addr);

        let instance = nacos.select_instance(&route.service_name, "roundrobin")
            .ok_or_else(|| anyhow::anyhow!("No available backend for service"))?;

        let upstream_addr = format!("http://{}:{}", instance.ip, instance.port);
        info!("Proxying SSE to {}", upstream_addr);

        let client = reqwest::Client::new();
        let upstream_url = format!("{}/events", upstream_addr);

        let response = client.get(&upstream_url)
            .header("Accept", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Upstream returned error: {}", response.status()));
        }

        let mut event_stream = response.bytes_stream();
        
        use tokio::io::AsyncWriteExt;
        let mut stream = stream;
        
        stream.write_all(
            b"HTTP/1.1 200 OK\r\n\
            Content-Type: text/event-stream\r\n\
            Cache-Control: no-cache\r\n\
            Connection: keep-alive\r\n\
            Access-Control-Allow-Origin: *\r\n\
            Access-Control-Allow-Headers: Content-Type\r\n\
            \r\n"
        ).await?;

        while let Some(chunk_result) = event_stream.next().await {
            match chunk_result {
                Ok(bytes) => {
                    stream.write_all(&bytes).await?;
                }
                Err(e) => {
                    error!("SSE upstream error: {}", e);
                    break;
                }
            }
        }

        info!("SSE connection closed");
        Ok(())
    }

    pub async fn shutdown(&self) {
        if let Some(tx) = self.shutdown_tx.write().take() {
            let _ = tx.send(());
        }
    }
}
