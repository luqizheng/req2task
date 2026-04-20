---
last_updated: 2026-04-20
status: active
owner: req2task团队
---

# 微服务架构设计

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端展示层 (Web - apps/web)               │
├─────────────────────────────────────────────────────────────────┤
│  项目看板  │  需求管理  │  任务跟踪  │  AI助手  │  报表中心     │
└──────┬─────────────────────────────────────────────────────────┘
       │ HTTP/WebSocket
┌──────▼─────────────────────────────────────────────────────────┐
│               API Gateway (@req2task/gateway)                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │路由转发 │  │认证鉴权 │  │限流熔断 │  │日志/链路追踪    │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘    │
└──────┬─────────────────────────────────────────────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│                        服务层                                   │
├───────────────┬───────────────┬──────────────────────────────┤
│   Service     │ai-chat-service│    file-conversion           │
│  (NestJS)     │   (Node.js)   │        (Node.js)             │
│  Port: 4000   │   Port: 4001  │      Port: 4002              │
└───────┬───────┴───────┬───────┴──────────────┬───────────────┘
        │               │                      │
┌───────▼───────────────▼──────────────────────▼───────────────┐
│                     数据层                                      │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│ PostgreSQL│  Redis   │ ChromaDB │ LLM Providers                │
│  数据库    │  缓存    │ 知识库    │ DeepSeek/OpenAI/Ollama     │
└──────────┴──────────┴──────────┴──────────────────────────────┘
```

## 2. 服务清单

| 服务 | 端口 | 职责 | 技术栈 |
|------|------|------|--------|
| gateway | 3000 | 统一入口、路由、治理 | NestJS |
| service | 4000 | 核心业务 API | NestJS |
| ai-chat-service | 4001 | 对话管理、LLM 集成 | Node.js |
| file-conversion | 4002 | 格式转换 | Node.js |

## 3. API Gateway 核心能力

### 3.1 路由转发

```
/api/auth/*       → service:4000
/api/users/*      → service:4000
/api/projects/*   → service:4000
/api/requirements/* → service:4000
/api/tasks/*     → service:4000
/api/ai/*        → service:4000
/api/conversations/* → ai-chat-service:4001
/api/chat/*      → ai-chat-service:4001
/api/convert/*   → file-conversion:4002
```

### 3.2 熔断器

- **触发条件**: 连续 5 次请求失败
- **恢复时间**: 30 秒
- **半开状态**: 通过健康检查后允许一个请求通过

### 3.3 限流

- **默认限制**: 100 请求/分钟/IP
- **可配置**: 通过 ThrottlerModule 配置

### 3.4 链路追踪

- 生成 `X-Request-Id` 请求头
- 记录每个请求的 traceId 和 spanId
- 保存最近 500 条链路记录

## 4. 服务注册与发现

### 4.1 内部注册中心

Gateway 维护服务实例列表：

```typescript
interface ServiceInstance {
  id: string;           // 实例 ID
  name: string;         // 服务名
  host: string;         // 主机地址
  port: number;         // 端口
  health: 'healthy' | 'unhealthy';
  weight: number;       // 负载权重
  lastHeartbeat: number;
}
```

### 4.2 负载均衡

加权轮询算法：
1. 计算所有健康实例的总权重
2. 生成 0 ~ 总权重 的随机数
3. 遍历实例，减去权重值，返回第一个<=0的实例

## 5. 健康检查

| 端点 | 说明 | 用途 |
|------|------|------|
| `/health` | 完整状态 | 管理员查看 |
| `/health/live` | 存活探针 | K8s livenessProbe |
| `/health/ready` | 就绪探针 | K8s readinessProbe |

## 6. 启动命令

```bash
# 开发环境
pnpm dev:gateway      # 启动 Gateway
pnpm dev:service      # 启动主服务
pnpm dev:ai-chat-service
pnpm dev:file-conversion

# 生产环境
pnpm build:gateway && pnpm start:gateway
```

## 7. 配置

环境变量配置见各服务 `.env.example`：

```bash
# Gateway
PORT=3000
SERVICE_HOST=localhost
SERVICE_PORT=4000
AI_CHAT_HOST=localhost
AI_CHAT_PORT=4001
FILE_CONVERSION_HOST=localhost
FILE_CONVERSION_PORT=4002
```

## 8. 未来扩展

### 8.1 Consul/Nacos 服务注册中心

当前使用内存注册中心，生产环境建议：

```yaml
# docker-compose.yml
consul:
  image: consul:latest
  ports:
    - "8500:8500"
```

### 8.2 消息队列

异步通信建议引入 Redis Streams 或 RabbitMQ：

```typescript
// 事件驱动架构
interface ServiceEvent {
  type: 'requirement.created' | 'task.completed';
  payload: unknown;
  timestamp: number;
}
```

### 8.3 分布式追踪

建议接入 OpenTelemetry + Jaeger：

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter(),
});
```
