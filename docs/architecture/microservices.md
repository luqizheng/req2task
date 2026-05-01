---
last_updated: 2026-05-02
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
| service | 4000 | 核心业务 API | NestJS |
| ai-chat-service | 4001 | 对话管理、LLM 集成 | Node.js |
| file-conversion | 4002 | 格式转换 | Node.js |

## 3. 健康检查

| 端点 | 说明 | 用途 |
|------|------|------|
| `/health` | 完整状态 | 管理员查看 |
| `/health/live` | 存活探针 | K8s livenessProbe |
| `/health/ready` | 就绪探针 | K8s readinessProbe |

## 4. 启动命令

```bash
# 开发环境
pnpm dev:service              # 启动主服务
pnpm dev:ai-chat-service
pnpm dev:file-conversion

# 生产环境
pnpm build:service && pnpm start:service
```

## 5. 配置

环境变量配置见各服务 `.env.example`：

```bash
# Service
PORT=4000
AI_CHAT_HOST=localhost
AI_CHAT_PORT=4001
FILE_CONVERSION_HOST=localhost
FILE_CONVERSION_PORT=4002
```

## 6. 未来扩展

### 6.1 消息队列

异步通信建议引入 Redis Streams 或 RabbitMQ：

```typescript
interface ServiceEvent {
  type: 'requirement.created' | 'task.completed';
  payload: unknown;
  timestamp: number;
}
```

### 6.2 分布式追踪

建议接入 OpenTelemetry + Jaeger：

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter(),
});
```
