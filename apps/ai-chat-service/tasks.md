# AI Chat Service 任务清单

## Phase 1: 数据库和配置层

### 1.1 添加数据库依赖
- [x] 在 `package.json` 中添加 TypeORM、pg、reflect-metadata 依赖
- [x] 添加 pino 日志库
- [x] 添加 dotenv 扩展变量支持

### 1.2 创建配置模块
- [x] 创建 `src/config/index.ts` 统一配置加载
- [x] 从环境变量读取数据库配置
- [x] 从环境变量读取 LLM 配置

### 1.3 创建数据库连接
- [x] 创建 `src/database/index.ts` 初始化 TypeORM 连接
- [x] 配置数据库连接参数
- [x] 启用 ESM 支持的装饰器

## Phase 2: 数据实体

### 2.1 创建 Conversation 实体
- [x] 创建 `src/database/entities/conversation.entity.ts`
- [x] 实现所有字段映射
- [x] 添加枚举类型定义

### 2.2 创建 ConversationMessage 实体
- [x] 创建 `src/database/entities/conversation-message.entity.ts`
- [x] 配置与 Conversation 的多对一关系
- [x] 实现消息内容字段

### 2.3 创建 LLMConfig 实体
- [x] 创建 `src/database/entities/llm-config.entity.ts`
- [x] 添加 LLMProviderType 枚举
- [x] 配置所有字段映射

## Phase 3: 服务层重构

### 3.1 重构 ConversationService
- [x] 将 Map 存储替换为 TypeORM Repository
- [x] 实现 CRUD 操作的数据库持久化
- [x] 添加分页查询支持
- [x] 添加归档功能
- [x] 添加对话链接功能

### 3.2 重构 LLMConfigService
- [x] 创建 `src/services/llm-config.service.ts`
- [x] 实现 CRUD 操作
- [x] 添加默认配置获取

### 3.3 完善 LLMService
- [x] 保持现有流式响应逻辑
- [x] 添加 completeWithConfig 支持多 provider
- [x] 支持 DeepSeek、OpenAI、Ollama

## Phase 4: 路由和控制器

### 4.1 重构 conversation.routes.ts
- [x] 整合 `ai-chat.controller.ts` 功能
- [x] 整合 `ai-conversation.controller.ts` 功能
- [x] 统一 API 路径前缀 `/api/ai/conversations`
- [x] 实现 SSE 流式端点

### 4.2 创建 llm-config.routes.ts
- [x] 创建 `src/routes/llm-config.routes.ts`
- [x] 实现 CRUD 端点
- [x] 实现测试端点 `POST /:id/test`

### 4.3 添加新端点
- [x] `GET /api/ai/conversations` - 列出对话
- [x] `POST /api/ai/conversations/:id/archive` - 归档对话
- [x] `POST /api/ai/conversations/:id/link/:nextId` - 链接对话

### 4.4 统一响应格式
- [x] 实现统一的 `{ code, data, message }` 响应格式
- [x] 添加全局错误处理中间件

## Phase 5: 数据库迁移

### 5.1 迁移脚本
- [ ] 创建初始化迁移脚本
- [ ] 配置迁移命令
- [ ] 添加迁移文档

## Phase 6: 环境配置

### 6.1 更新 .env.example
- [x] 添加数据库相关配置
- [x] 添加日志级别配置
- [x] 添加 OpenAI 默认模型配置

## Phase 7: 前端集成

### 7.1 更新前端 API
- [x] 更新 `apps/web/src/api/ai.ts` 添加 `aiChatApi`
- [x] 更新 `apps/web/src/stores/ai.ts` 使用 `aiChatApi`
- [x] 更新 `apps/web/src/views/AiConfig/AiConfigTestView.vue`

### 7.2 更新 vitest.config.ts
- [x] 添加 `/api/ai-chat` 代理到 `http://localhost:4001`

## Phase 8: 清理 core 项目（重要）

### 8.1 删除 conversation 实体
- [x] 删除 `packages/core/src/entities/conversation.entity.ts`
- [x] 删除 `packages/core/src/entities/conversation-message.entity.ts`

### 8.2 删除 conversation 服务
- [x] 删除 `packages/core/src/ai/services/ai-conversation.service.ts`
- [x] 删除 `packages/core/src/ai/services/ai-chat.service.ts`

### 8.3 删除 conversation 控制器
- [x] 删除 `apps/service/src/ai/controllers/ai-conversation.controller.ts`
- [x] 删除 `apps/service/src/ai/controllers/ai-chat.controller.ts`

### 8.4 更新导出和模块注册
- [x] 更新 `packages/core/src/ai/index.ts` 移除相关导出
- [x] 更新 `apps/service/src/ai/ai.module.ts` 移除 controller 注册
- [x] 检查是否有其他文件引用这些删除的模块

### 8.5 更新 RawRequirementCollection 模块
- [x] 创建 `ai-chat-client.service.ts` 调用 ai-chat-service
- [x] 更新 `raw-requirement-collection.controller.ts` 使用新客户端
- [x] 更新 `raw-requirement-collection.module.ts`

### 8.6 数据库迁移
- [ ] 确认 ai-chat-service 拥有独立数据库或表
- [ ] 如需共享数据库，考虑保留 core 中的实体定义

## 任务执行顺序

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
```

## 预计工作量

- Phase 1-2: 基础架构 (20%)
- Phase 3-4: 核心功能 (35%)
- Phase 5-6: 完善工作 (15%)
- Phase 7-8: 集成和清理 (30%)
