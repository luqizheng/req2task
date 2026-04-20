# AI Chat Service 任务清单

## Phase 1: 数据库和配置层

### 1.1 添加数据库依赖
- [ ] 在 `package.json` 中添加 TypeORM、pg、reflect-metadata 依赖
- [ ] 添加 pino 日志库
- [ ] 添加 dotenv 扩展变量支持

### 1.2 创建配置模块
- [ ] 创建 `src/config/index.ts` 统一配置加载
- [ ] 从环境变量读取数据库配置
- [ ] 从环境变量读取 LLM 配置

### 1.3 创建数据库连接
- [ ] 创建 `src/database/index.ts` 初始化 TypeORM 连接
- [ ] 配置数据库连接参数
- [ ] 启用 ESM 支持的装饰器

## Phase 2: 数据实体

### 2.1 创建 Conversation 实体
- [ ] 创建 `src/database/entities/conversation.entity.ts`
- [ ] 实现所有字段映射
- [ ] 添加枚举类型定义

### 2.2 创建 ConversationMessage 实体
- [ ] 创建 `src/database/entities/conversation-message.entity.ts`
- [ ] 配置与 Conversation 的多对一关系
- [ ] 实现消息内容字段

## Phase 3: 服务层重构

### 3.1 重构 ConversationService
- [ ] 将 Map 存储替换为 TypeORM Repository
- [ ] 实现 CRUD 操作的数据库持久化
- [ ] 添加分页查询支持
- [ ] 添加归档功能
- [ ] 添加对话链接功能

### 3.2 完善 LLMService
- [ ] 保持现有流式响应逻辑
- [ ] 添加模型配置支持
- [ ] 优化文件处理逻辑

## Phase 4: 路由和控制器

### 4.1 重构 conversation.routes.ts
- [ ] 整合 `ai-chat.controller.ts` 功能
- [ ] 整合 `ai-conversation.controller.ts` 功能
- [ ] 统一 API 路径前缀 `/api/ai/conversations`
- [ ] 实现 SSE 流式端点

### 4.2 添加新端点
- [ ] `GET /api/ai/conversations` - 列出对话
- [ ] `POST /api/ai/conversations/:id/archive` - 归档对话
- [ ] `POST /api/ai/conversations/:id/link/:nextId` - 链接对话

### 4.3 统一响应格式
- [ ] 实现统一的 `{ code, data, message }` 响应格式
- [ ] 添加全局错误处理中间件

## Phase 5: 数据库迁移

### 5.1 迁移脚本
- [ ] 创建初始化迁移脚本
- [ ] 配置迁移命令
- [ ] 添加迁移文档

## Phase 6: 环境配置

### 6.1 更新 .env.example
- [ ] 添加数据库相关配置
- [ ] 添加日志级别配置
- [ ] 添加 OpenAI 默认模型配置

## Phase 7: 测试和文档

### 7.1 类型更新
- [ ] 更新 `src/types.ts` 统一类型定义
- [ ] 确保与 NestJS 服务类型兼容

### 7.2 注释和日志
- [ ] 添加关键方法的 JSDoc 注释
- [ ] 使用结构化日志替换 console.log

## Phase 8: 清理 core 项目（重要）

### 8.1 删除 conversation 实体
- [ ] 删除 `packages/core/src/entities/conversation.entity.ts`
- [ ] 删除 `packages/core/src/entities/conversation-message.entity.ts`

### 8.2 删除 conversation 服务
- [ ] 删除 `packages/core/src/ai/services/ai-conversation.service.ts`
- [ ] 删除 `packages/core/src/ai/services/ai-chat.service.ts`

### 8.3 删除 conversation 控制器
- [ ] 删除 `apps/service/src/ai/controllers/ai-conversation.controller.ts`
- [ ] 删除 `apps/service/src/ai/controllers/ai-chat.controller.ts`

### 8.4 更新导出和模块注册
- [ ] 更新 `packages/core/src/index.ts` 移除 conversation 相关导出
- [ ] 更新 `apps/service/src/ai/ai.module.ts` 移除 controller 注册
- [ ] 检查是否有其他文件引用这些删除的模块

### 8.5 数据库迁移
- [ ] 确认 ai-chat-service 拥有独立数据库或表
- [ ] 如需共享数据库，考虑保留 core 中的实体定义

## Phase 9: 前端代理配置

### 9.1 更新 vitest.config.ts
- [ ] 添加 `/api/ai-chat` 代理到 `http://localhost:4001`

## 任务执行顺序

```
Phase 1 (依赖) → Phase 2 (依赖) → Phase 3 (依赖) → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
```

## 预计工作量

- Phase 1-2: 基础架构 (25%)
- Phase 3-4: 核心功能 (40%)
- Phase 5-7: 完善工作 (15%)
- Phase 8-9: 清理和集成 (20%)
