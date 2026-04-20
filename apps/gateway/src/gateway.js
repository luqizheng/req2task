const { startGateway } = require('liten-gateway');
const http = require('http');
const httpProxy = require('http-proxy');

const nacosHost = process.env.NACOS_HOST || 'localhost';
const nacosPort = parseInt(process.env.NACOS_PORT || '8848', 10);
const nacosTimeout = parseInt(process.env.NACOS_TIMEOUT || '3000', 10);
const cacheTtl = parseInt(process.env.CACHE_TTL || '5000', 10);
const proxyTimeout = parseInt(process.env.PROXY_TIMEOUT || '10000', 10);

const serviceMap = new Map();
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: proxyTimeout,
});

proxy.on('error', (err, req, res) => {
  console.error(`[Proxy Error] ${req.method} ${req.url}: ${err.message}`);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  }
});

function getServiceAddress(serviceName) {
  const cached = serviceMap.get(serviceName);
  if (cached && (Date.now() - cached.timestamp) < cacheTtl) {
    const instance = cached.instances[cached.index % cached.instances.length];
    cached.index++;
    return `http://${instance.ip}:${instance.port}`;
  }
  return null;
}

function updateServiceCache(serviceName, instances) {
  if (!instances.length) {
    console.warn(`[Service Discovery] No healthy instances for ${serviceName}`);
    return false;
  }
  const cached = serviceMap.get(serviceName);
  const index = cached?.index || 0;
  serviceMap.set(serviceName, { instances, index, timestamp: Date.now() });
  console.log(`[Service Discovery] ${serviceName}: ${instances.length} instances cached`);
  return true;
}

async function fetchInstances(serviceName) {
  const url = `http://${nacosHost}:${nacosPort}/nacos/v1/ns/instance/list?serviceName=${serviceName}`;
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: nacosTimeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const instances = json.hosts?.filter(i => i.healthy && i.enabled) || [];
          resolve(instances);
        } catch (e) {
          console.error(`[Nacos] Parse error for ${serviceName}: ${e.message}`);
          reject(new Error('Invalid response from Nacos'));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Nacos request timeout'));
    });
    req.on('error', (e) => {
      console.error(`[Nacos] Request error for ${serviceName}: ${e.message}`);
      reject(e);
    });
  });
}

async function getServiceAddressWithRefresh(serviceName) {
  let targetUrl = getServiceAddress(serviceName);
  if (!targetUrl) {
    const instances = await fetchInstances(serviceName);
    if (!instances.length) {
      const cached = serviceMap.get(serviceName);
      if (cached?.instances?.length) {
        const instance = cached.instances[cached.index % cached.instances.length];
        targetUrl = `http://${instance.ip}:${instance.port}`;
        console.warn(`[Service Discovery] Using stale cache for ${serviceName}`);
      } else {
        throw new Error(`No available instance for ${serviceName}`);
      }
    } else {
      updateServiceCache(serviceName, instances);
      const instance = instances[0];
      targetUrl = `http://${instance.ip}:${instance.port}`;
    }
  }
  return targetUrl;
}

setInterval(() => {
  const now = Date.now();
  for (const [name, cached] of serviceMap.entries()) {
    if (now - cached.timestamp > cacheTtl * 3) {
      serviceMap.delete(name);
      console.log(`[Cache] Evicted stale entry for ${name}`);
    }
  }
}, cacheTtl);

async function main() {
  const gw = startGateway();
  gw.addDomain('order.service.local', async (req, res) => {
    try {
      const targetUrl = await getServiceAddressWithRefresh('order-service');
      console.log(`[Router] ${req.method} ${req.url} -> ${targetUrl}`);
      proxy.web(req, res, { target: targetUrl });
    } catch (err) {
      console.error(`[Router] ${req.method} ${req.url} failed: ${err.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service unavailable', message: err.message }));
    }
  });
  console.log('[Gateway] Liten Gateway with Nacos service discovery is running.');
  console.log(`[Gateway] Nacos: ${nacosHost}:${nacosPort}, Cache TTL: ${cacheTtl}ms`);
}
main();
