use crate::config::{Protocol, RouteConfig};
use crate::nacos::NacosServiceDiscovery;
use anyhow::Result;
use http::{Request, Response};
use parking_lot::RwLock;
use pingora::proxy::http_proxy_service;
use pingora::proxy::ProxyHttp;
use pingora::server::Listening;
use pingora::upstreams::peer::Peer;
use pingora::Error;
use pingora::ErrorType;
use std::sync::Arc;
use tracing::{error, info};

pub struct HttpProxy {
    nacos: Arc<NacosServiceDiscovery>,
    routes: Arc<RwLock<Vec<RouteConfig>>>,
}

impl HttpProxy {
    pub fn new(nacos: Arc<NacosServiceDiscovery>, routes: Vec<RouteConfig>) -> Self {
        Self {
            nacos,
            routes: Arc::new(RwLock::new(routes)),
        }
    }

    pub fn start(&self) -> Result<Vec<Listening>> {
        let mut server = pingora::server::Server::new(None)?;
        server.bootstrap();

        let mut listeners = vec![];

        for route in self.routes.read().iter().filter(|r| r.protocol == Protocol::Http) {
            let route_clone = route.clone();
            let nacos_clone = self.nacos.clone();
            let routes_clone = self.routes.clone();

            let mut conf = pingora::server::ServerConf::default();
            conf.timeout = Some(std::time::Duration::from_secs(route_clone.timeout_secs));

            let mut ps = pingora::proxy::http_proxy_service(&conf, move || {
                Arc::new(HttpProxy::new(
                    nacos_clone.clone(),
                    routes_clone.read().clone(),
                ))
            });

            let addr = format!("{}:{}", route_clone.path.split(':').next().unwrap_or("0.0.0.0"), 8080);
            ps.add_tcp(&addr);
            
            info!("HTTP proxy listening on {}", addr);
            listeners.push(server.add_service(ps));
        }

        Ok(listeners)
    }
}

impl ProxyHttp for HttpProxy {
    type CTX = ();
    
    fn new_ctx(&self) -> Self::CTX {}

    fn init(&self) -> Result<(), Error> {
        Ok(())
    }

    fn upstream_addr(
        &self,
        session: &mut pingora::http::Session,
    ) -> Result<Box<dyn Peer>, Error> {
        let path = session.req_header().uri.path();
        
        let routes = self.routes.read();
        let route = routes.iter()
            .find(|r| path.starts_with(&r.path) && r.protocol == Protocol::Http)
            .ok_or_else(|| Error::new(ErrorType::ProxyNoBackend))?;

        let instance = self.nacos.select_instance(&route.service_name, "roundrobin")
            .ok_or_else(|| Error::new(ErrorType::ProxyNoBackend))?;

        let addr = format!("{}:{}", instance.ip, instance.port);
        info!("Routing {} to {}", path, addr);

        let peer = pingora::upstreams::peer::HttpPeer::new(
            &addr,
            false,
            "upstream".to_string(),
        );
        
        Ok(Box::new(peer))
    }

    async fn upstream_request_filter(
        &self,
        _session: &mut pingora::http::Session,
        _req: &mut Request<()>,
        _ctx: &mut Self::CTX,
    ) -> Result<(), Error> {
        Ok(())
    }

    async fn response_filter(
        &self,
        _session: &mut pingora::http::Session,
        _response: &mut Response<()>,
        _ctx: &mut Self::CTX,
    ) -> Result<(), Error> {
        Ok(())
    }

    fn log_error(&self, session: &mut pingora::http::Session, error: &Error, ctx: &mut Self::CTX) {
        error!("Request failed: {:?}", error);
    }
}
