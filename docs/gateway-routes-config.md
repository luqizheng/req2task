# Gateway 路由配置

## 服务信息

| 服务名 | Nacos注册名 | 端口 | 默认前缀 |
|--------|------------|------|---------|
| 主服务 | `req2task.service` | 4000 | /api |
| AI聊天服务 | `req2task.ai-chat-service` | 4001 | /api |


## 路由规则

### Service (主服务)

| 路由前缀 | 功能模块 | Controller |
|---------|---------|------------|
| `/api/auth/*` | 认证模块 | auth.controller |
| `/api/users/*` | 用户模块 | users.controller |
| `/api/projects/*` | 项目模块 | projects.controller |
| `/api/requirements/*` | 需求模块 | requirements.controller |
| `/api/tasks/*` | 任务模块 | tasks.controller |
| `/api/notifications/*` | 通知模块 | notification.controller |
| `/api/feature-modules/*` | 功能模块 | feature-modules.controller |
| `/api/collections/*` | 原始需求收集 | raw-requirement-collection.controller |
| `/api/conversations/*` | 对话模块 | conversation.controller |
| `/api/attachments/*` | 附件模块 | project-attachment.controller |
| `/api/ai/*` | AI能力 | ai-chat, requirement-generation, conflict-detection, task-decomposition |
| `/api/ai/vector-store/*` | 向量存储 | vector-store.controller |

### AI Chat Service

| 路由前缀 | 功能模块 | 文件 |
|---------|---------|------|
| `/api/ai/conversations/*` | 对话管理 | conversation.routes.js |
| `/api/ai/text/*` | 文本处理 | text.routes.js |
| `/api/llm-configs/*` | LLM配置 | llm-config.routes.js |
| `/api/ai/llm-configs/*` | LLM配置 | llm-config.routes.js |

## 完整配置示例

详细配置示例见 [apps/gateway/router.demo.md](../../apps/gateway/router.demo.md)，包含：
- 完整 JSON 配置示例
- 负载均衡策略原理说明
- 熔断器配置说明
- RustFS 手动注册指南

## Nacos 配置

### Data ID: `gateway-routes`
### Group: `DEFAULT_GROUP`

完整配置见 `docs/nacos/gateway-routes.json`。

### Data ID: `gateway-loadbalancer`
### Group: `DEFAULT_GROUP`

完整配置见 `docs/nacos/gateway-loadbalancer.json`。

**支持的负载均衡策略**：
| 策略 | 说明 |
|------|------|
| `roundRobin` | 轮询 |
| `weightedRoundRobin` | 加权轮询 |
| `weightedRandom` | 加权随机 |

**配置字段**：
| 字段 | 说明 |
|------|------|
| `defaultStrategy` | 默认策略 |
| `strategies` | 各服务独立策略（key 为 Nacos 注册的服务名）|

## 环境变量

### 熔断器配置 (Circuit Breaker)

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `CIRCUIT_BREAKER_THRESHOLD` | 5 | 失败次数阈值 |
| `CIRCUIT_BREAKER_RESET_TIMEOUT` | 30000 | 重置超时(ms) |
| `CIRCUIT_BREAKER_HALF_OPEN_REQUESTS` | 1 | 半开状态请求数 |

### Nacos 连接配置

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `NACOS_HOST` | localhost | Nacos 服务器地址 |
| `NACOS_PORT` | 8848 | Nacos 服务器端口 |
| `NACOS_NAMESPACE` | public | 命名空间 |
| `NACOS_USERNAME` | nacos | 用户名 |
| `NACOS_PASSWORD` | nacos | 密码 |
| `NACOS_GROUP` | DEFAULT_GROUP | 配置分组 |
