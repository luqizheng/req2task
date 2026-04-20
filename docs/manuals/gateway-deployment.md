# API Gateway 部署指南

## 环境要求

### 基础环境
- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Nacos >= 2.0.0
- Docker >= 24.0.0 (可选)

### 端口要求
- Gateway: 3000
- Nacos: 8848
- Service: 4000
- AI Chat Service: 4001
- File Conversion Service: 4002

## 开发环境部署

### 1. 安装依赖
```bash
cd apps/gateway
pnpm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并配置：
```bash
cp .env.example .env
```

主要配置项：
- `NACOS_HOST`: Nacos 服务地址
- `NACOS_PORT`: Nacos 端口
- `PORT`: Gateway 监听端口

### 3. 启动开发服务器
```bash
pnpm start:dev
```

或使用项目根目录命令：
```bash
pnpm dev:gateway
```

## 生产环境部署

### Docker 部署

#### 1. 构建镜像
```bash
pnpm build:docker:gateway
```

#### 2. 配置 docker-compose
```yaml
services:
  gateway:
    image: req2task-gateway:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NACOS_HOST=nacos
      - NACOS_PORT=8848
      - PORT=3000
    depends_on:
      - nacos
    restart: unless-stopped
```

#### 3. 启动服务
```bash
docker-compose up -d gateway
```

### Kubernetes 部署

#### 1. 创建 ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gateway-config
data:
  NACOS_HOST: "nacos"
  NACOS_PORT: "8848"
```

#### 2. 创建 Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway
  template:
    metadata:
      labels:
        app: gateway
    spec:
      containers:
        - name: gateway
          image: req2task-gateway:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: gateway-config
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 3000
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 3000
```

## 高可用部署

### 集群模式

推荐部署 3 个以上 Gateway 实例：

1. 所有实例连接同一个 Nacos 注册中心
2. 使用负载均衡器（如 Nginx）分发请求
3. 配置健康检查自动剔除故障节点

### 健康检查配置

```nginx
upstream gateway_backend {
    least_conn;
    
    server gateway-1:3000;
    server gateway-2:3000;
    server gateway-3:3000;
    
    keepalive 32;
}

server {
    location / {
        proxy_pass http://gateway_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        health_check interval=5 passes=2 fails=3;
    }
}
```

## 验证部署

### 1. 检查健康状态
```bash
curl http://localhost:3000/api/health
```

### 2. 检查指标
```bash
curl http://localhost:3000/metrics
```

### 3. 测试路由转发
```bash
curl http://localhost:3000/api/auth/login
```

## 故障排查

### 常见问题

1. **Nacos 连接失败**
   - 检查 Nacos 服务是否启动
   - 验证网络连通性
   - 检查防火墙配置

2. **路由转发失败**
   - 检查目标服务是否启动
   - 验证路由规则配置
   - 查看日志中的错误信息

3. **熔断器打开**
   - 检查后端服务状态
   - 查看熔断器状态：`curl http://localhost:3000/api/circuit-breaker/status`
   - 手动重置：`curl -X POST http://localhost:3000/api/circuit-breaker/reset`

### 日志查看
```bash
# Gateway 日志
docker logs gateway

# 查看详细日志
docker logs -f gateway
```

## 性能调优

### JVM/Node.js 参数
```bash
NODE_OPTIONS="--max-old-space-size=2048"
```

### 连接池配置
```bash
MAX_CONNECTIONS=1000
KEEP_ALIVE_TIMEOUT=60000
```
