# 精简 AI Chat Spec

## Why
ai-chat 包功能冗余，conversationId 生命周期管理复杂，需要简化设计。同时 adapter 缺少历史消息转换能力。

## What Changes
- 移除 `onConversationCreated` 回调
- 移除 `conversationId` 相关状态和方法
- 移除 StreamChunk 中的 conversationId 相关字段
- 移除业务相关代码：`requirementCollectAdapter`
- adapter 增加远程操作方法

## Impact
- Affected specs: 移除 conversationId 管理能力，移除业务耦合
- Affected code:
  - `packages/ai-chat/src/types/config.ts`
  - `packages/ai-chat/src/types/adapter.ts`
  - `packages/ai-chat/src/types/events.ts`
  - `packages/ai-chat/src/composables/useChat.ts`
  - `packages/ai-chat/src/composables/useStream.ts`
  - `packages/ai-chat/src/components/AIChat.vue`
  - `packages/ai-chat/src/adapters/index.ts`
  - `packages/ai-chat/src/index.ts`

## ADDED Requirements
### Requirement: Adapter 远程操作方法
adapter 需要支持远程消息操作。

#### Scenario: 删除消息
- **WHEN** 用户发起删除消息操作
- **THEN** 调用 `onDelete(message: AIChatMessage)` 从远程删除

#### Scenario: 分页加载历史消息
- **WHEN** 需要加载历史消息
- **THEN** 调用 `onSearch(page: number, pageSize): Promise<AIChatMessage[]>` 获取历史消息

## MODIFIED Requirements
### Requirement: AIChatConfig
移除 `sessionId` 字段，简化配置。

### Requirement: StreamChunk
移除 `conversationId`、`isNewConversation` 字段。

### Requirement: SendMessageOptions
移除 `conversationId` 参数。

## REMOVED Requirements
### Requirement: ConversationId 生命周期管理
**Reason**: 会话管理应下沉到业务层，chat 组件保持无状态
**Migration**: 业务层自行管理会话 ID，通过不同 chat 实例隔离
