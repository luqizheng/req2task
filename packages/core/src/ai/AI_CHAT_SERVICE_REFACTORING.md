# AI Chat Service 重构说明

## 概述

本次重构创建了统一的 AI 对话底层服务 `AIChatService`，作为所有业务模块与 LLM 对话的中间层。

## 新增文件

### 1. `packages/core/src/ai/ai-chat.service.ts`

核心服务，提供以下功能：

- **对话管理**：创建和管理 Conversation 对话
- **消息持久化**：自动保存用户和助手消息到数据库
- **SSE 流式响应**：支持 Server-Sent Events 实时流式输出
- **多格式文件支持**：解析 docx/pdf/txt/音频文件并发送给 LLM
- **对话历史**：维护完整的对话上下文

主要接口：

```typescript
interface ChatContext {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

interface SendMessageDto {
  content: string;
  files?: FileContent[];
}

// 创建对话
createConversation(context: ChatContext): Promise<Conversation>

// 发送消息（非流式）
sendMessage(conversationId: string, dto: SendMessageDto, configId?: string): Promise<ChatResult>

// 发送消息（流式，SSE）
streamMessage(conversationId: string, dto: SendMessageDto, configId?: string): AsyncGenerator<StreamChunk>
```

### 2. `packages/core/src/ai/file-parser.service.ts`

文件解析服务，支持多种文件格式：

- **text**：纯文本直接返回
- **docx**：提取 XML 中的文本内容
- **pdf**：提取 PDF 流中的文本
- **audio**：返回语音转文本提示（需要集成语音识别服务）

### 3. `apps/service/src/ai/controllers/ai-chat.controller.ts`

REST API 控制器，提供以下端点：

```
POST   /ai-chat/conversations                    - 创建对话
GET    /ai-chat/conversations/:id                - 获取对话详情
GET    /ai-chat/conversations/:id/messages       - 获取消息列表
POST   /ai-chat/conversations/:id/messages       - 发送消息
SSE    /ai-chat/conversations/:id/stream         - 流式发送消息
DELETE /ai-chat/conversations/:id                - 清空对话
POST   /ai-chat/conversations/:id/continue       - 继续对话
SSE    /ai-chat/conversations/:id/continue/stream - 流式继续对话
```

## 改造内容

### 1. `RawRequirementCollectionController`

更新了以下端点使用 AIChatService：

- `POST /collections/:id/chat` - 使用 AIChatService.sendMessage
- `SSE /collections/:id/stream` - 使用 AIChatService.streamMessage
- `POST /collections/raw-requirements/:id/chat` - 使用 AIChatService.sendMessage
- `SSE /collections/raw-requirements/:id/stream` - 使用 AIChatService.streamMessage

### 2. `AiModule`

- 添加 AIChatController 到控制器列表
- 添加 AIChatService 和 FileParserService 到 providers
- 导出 AIChatService 和 FileParserService

### 3. `RawRequirementCollectionModule`

- 添加 AIChatService provider
- 导出 AIChatService

## 使用示例

### 前端调用示例

```typescript
// 非流式对话
const response = await fetch('/ai-chat/conversations/xxx/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '用户消息',
    files: [
      { type: 'text', data: '附件内容' }
    ],
    configId: 'optional-llm-config-id'
  })
});

// SSE 流式对话
const eventSource = new EventSource('/ai-chat/conversations/xxx/stream', {
  method: 'POST',
  body: JSON.stringify({ content: '用户消息' })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'content') {
    console.log('收到内容:', data.content);
  } else if (data.type === 'metadata') {
    console.log('对话元数据:', data);
  } else if (data.type === 'error') {
    console.error('错误:', data.error);
  }
};
```

## 架构优势

1. **解耦**：业务逻辑与 LLM 调用分离
2. **可复用**：多个业务模块可共享同一个对话服务
3. **可测试**：独立的 FileParserService 便于单元测试
4. **可扩展**：易于添加新的文件格式支持
5. **标准化**：统一的 API 接口和响应格式

## 下一步优化建议

1. 添加语音识别集成（如 Whisper）
2. 实现对话摘要功能
3. 添加对话标签和分类
4. 实现对话导出（Markdown、PDF）
5. 添加对话相似度匹配（基于 ChromaDB）
