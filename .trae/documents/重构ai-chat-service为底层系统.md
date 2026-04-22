# 重构 ai-chat-service 为底层系统

## 目标
将 `ai-chat-service` 从业务耦合的服务重构为纯粹的底层对话存储和 LLM 调用服务。

## 当前问题
- `Conversation` 实体包含 `collectionId`、`rawRequirementId` 等业务字段
- `ConversationService` 包含 `findByCollectionId`、`findByRawRequirementId` 等业务查询方法
- 服务层暴露了业务概念，违反分层原则

## 重构步骤

### 1. 移除业务相关字段（Conversation 实体）
**文件**: `src/database/entities/conversation.entity.ts`
- [ ] 删除 `collectionId` 字段
- [ ] 删除 `rawRequirementId` 字段
- [ ] 删除 `nextConversationId` 字段（业务关联）
- [ ] 删除 `conversationType` 字段（业务概念）
- [ ] 保留通用字段：`id`、`title`、`systemPrompt`、`status`、`messageCount`、`metadata`、`createdAt`、`updatedAt`

### 2. 清理 types.ts 中的业务类型
**文件**: `src/types.ts`
- [ ] 从 `CreateConversationRequest` 删除 `collectionId`、`rawRequirementId`
- [ ] 从 `Conversation` 接口删除对应字段
- [ ] 简化 `metadata` 为通用 JSON 存储

### 3. 清理 ConversationService 业务方法
**文件**: `src/services/conversation.service.ts`
- [ ] 删除 `findByCollectionId` 方法
- [ ] 删除 `findByRawRequirementId` 方法
- [ ] 删除 `getOrCreate` 方法中的业务关联逻辑
- [ ] 删除 `create` 方法中的 `collectionId`、`rawRequirementId` 处理
- [ ] 删除 `updateMetadata` 中的 `questionCount`、`keyElements` 等业务字段逻辑

### 4. 清理 conversation.routes.ts 业务端点
**文件**: `src/routes/conversation.routes.ts`
- [ ] 检查并移除任何依赖业务字段的路由逻辑
- [ ] 简化 SSE 响应中的元数据

### 5. 简化元数据结构
- [ ] 将 `metadata` 改为通用 `Record<string, unknown>` 类型
- [ ] 不预设业务字段，由调用方自行存储业务关联

### 6. 数据库迁移
- [ ] 创建迁移文件移除 `collection_id`、`raw_requirement_id`、`next_conversation_id`、`conversation_type` 列
- [ ] 更新 `metadata` 列为通用 JSON

## 关键原则
1. **调用方负责业务关联**：如需关联 `collectionId` 或 `rawRequirementId`，由调用方（service）自行管理
2. **通用元数据**：使用 `metadata` JSON 字段存储调用方的业务数据
3. **纯对话功能**：只保留对话创建、消息管理、LLM 调用等核心功能
