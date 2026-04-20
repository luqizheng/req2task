# 微服务架构设计

## 文档导航

本文档包含微服务架构的完整设计，拆分为以下独立文档：

| 文档 | 说明 |
|------|------|
| [overview.md](overview.md) | 系统架构概览 |
| [ai-chat-service.md](ai-chat-service.md) | AI Chat Service 详细设计 |
| [file-conversion-service.md](file-conversion-service.md) | File Conversion Service 详细设计 |
| [service-communication.md](service-communication.md) | 服务间通信设计 |
| [deployment.md](deployment.md) | 部署配置 |

---

## 1. 服务架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Web)                                │
│                  Vue 3 + Element Plus + AIChat UI                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP / SSE
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API Gateway / Main Service                           │
│                        (NestJS)                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   Auth       │ │  Projects    │ │ Requirements │ │  Collections │  │
│  │   Module     │ │   Module     │ │   Module     │ │   Module     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP / SSE
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│    AI Chat Service      │           │  File Conversion Svc    │
│    (独立 HTTP 服务)      │           │    (独立 HTTP 服务)      │
│                         │           │                        │
│  • LLM 对话             │           │  • PDF → TXT           │
│  • LLM 配置管理          │           │  • DOCX → TXT          │
│  • Stream 响应          │           │  • Audio → TXT         │
└─────────────────────────┘           └─────────────────────────┘
```

---

## 2. 服务职责划分

### 2.1 Main Service (NestJS)

**职责**：
- 业务逻辑处理
- 数据持久化（PostgreSQL）
- 文件存储（MinIO）
- 权限控制
- 外部 API 聚合

**模块**：
| 模块 | 职责 |
|------|------|
| Auth | 认证授权 |
| Projects | 项目管理 |
| Requirements | 需求管理 |
| Collections | 需求收集（协调层）|
| Attachments | 附件管理 |
| Notifications | 通知 |

### 2.2 AI Chat Service

详见 [ai-chat-service.md](ai-chat-service.md)

### 2.3 File Conversion Service

详见 [file-conversion-service.md](file-conversion-service.md)

---

## 3. 服务间通信

详见 [service-communication.md](service-communication.md)

---

## 4. 部署配置

详见 [deployment.md](deployment.md)

---

## 5. Monorepo 结构

```
req2task/
├── apps/
│   ├── web/                 # Vue 3 前端
│   ├── service/             # NestJS 主服务
│   ├── ai-chat-service/     # AI Chat 独立服务
│   └── file-conversion/     # 文件转换服务
├── packages/
│   ├── core/                # 共享实体、服务
│   ├── dto/                 # 共享 DTO
│   └── shared-types/        # 共享类型定义
├── docs/
│   └── architecture/        # 架构文档
├── docker-compose.yml
└── pnpm-workspace.yaml
```
