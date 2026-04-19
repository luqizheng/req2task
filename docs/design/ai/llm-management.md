---
last_updated: 2026-04-19
status: active
owner: req2task团队
---

# LLM 服务模块

## 概述

本模块提供统一的LLM（大语言模型）服务封装，支持多种提供商，并提供完整的配置管理功能。

## 特性

- 多提供商支持：DeepSeek、OpenAI、Ollama、MiniMax
- 流式响应支持：SSE 流式输出
- 请求重试机制：自动重试失败请求
- 超时控制：默认30秒超时
- 健康监控：实时监控各提供商状态
- 指标收集：追踪调用次数、延迟等指标
- 工厂模式：统一的LLM服务获取接口
- 配置管理：完整的 CRUD API 管理 LLM 配置
- **AIChatService**：统一对话服务，支持文件解析和持久化
- **FileParserService**：多格式文件解析（docx/pdf/txt/audio）

## 架构分层

```
┌──────────────────────────────────────────────────────┐
│  AIChatService (对话服务层)                           │
│  - 对话持久化 (Conversation/ConversationMessage)     │
│  - 文件解析 (FileParserService)                       │
│  - SSE 流式响应                                      │
├──────────────────────────────────────────────────────┤
│  LLMService (LLM 调用层)                            │
│  - 提供商选择                                        │
│  - 请求/响应处理                                     │
│  - 流式生成                                         │
├──────────────────────────────────────────────────────┤
│  Provider 层 (具体实现)                             │
│  - DeepSeekProvider / OpenAIProvider                │
│  - OllamaProvider / MiniMaxProvider                 │
└──────────────────────────────────────────────────────┘
```

## AIChatService

统一的对话服务，负责：

1. **对话生命周期管理**
   - 创建/获取对话（按 collectionId 或 rawRequirementId）
   - 消息持久化到 ConversationMessage 表
   - 对话状态追踪

2. **消息处理**
   - 支持带附件的消息（docx/pdf/txt/audio）
   - 自动构建消息历史上下文
   - 解析 AI 响应中的追问问题

3. **流式响应**
   - AsyncGenerator 模式
   - SSE 事件封装
   - Token 使用量统计

### 核心方法

```typescript
// 创建对话
createConversation(context: ChatContext): Promise<Conversation>

// 获取或创建对话
getOrCreateConversation(context: ChatContext): Promise<Conversation>

// 发送消息（非流式）
sendMessage(
  conversationId: string,
  dto: SendMessageDto,
  configId?: string,
  systemPrompt?: string
): Promise<ChatResult>

// 发送消息（流式）
streamMessage(
  conversationId: string,
  dto: SendMessageDto,
  configId?: string,
  systemPrompt?: string
): AsyncGenerator<StreamChunk>
```

## FileParserService

文件解析服务，支持多种格式：

| 格式 | 处理方式 | 说明 |
|------|----------|------|
| text | 直接返回 | 纯文本内容 |
| docx | XML 解析 | 提取 `<w:t>` 标签内容 |
| pdf | 流解析 | 提取 `stream` 中的 Tj 操作符文本 |
| audio | 占位提示 | 需集成语音识别服务 |

### 解析方法

```typescript
// 解析文件内容
parse(file: FileContent): Promise<{ content: string; type: string }>

// 从路径解析文件
parseFromPath(filePath: string): Promise<{ content: string; type: string }>
```

## 支持的提供商

| 提供商 | 模型 | API Endpoint | 特性 |
|--------|------|--------------|------|
| DeepSeek | deepseek-chat | https://api.deepseek.com/v1 | 函数调用、流式响应 |
| OpenAI | gpt-4o | https://api.openai.com/v1 | 函数调用、视觉支持、流式响应 |
| Ollama | llama3.1:8b | http://localhost:11434/api | 本地部署、流式响应 |
| MiniMax | 需要配置 | https://api.minimaxi.com/anthropic | 函数调用、流式响应 |

## API 端点

### LLM 调用 API

#### 1. 调用默认LLM服务

```http
POST /api/llm/call
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

#### 2. 流式调用默认LLM服务

```http
POST /api/llm/stream
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

#### 3. 调用指定提供商

```http
POST /api/llm/call/:provider
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "model": "deepseek-chat"
}
```

支持的 provider: deepseek, openai, ollama, minimax

#### 4. 获取健康状态

```http
GET /api/llm/health
```

响应示例：

```json
[
  {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "isHealthy": true,
    "latency": 125,
    "lastCheckAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### 配置管理 API

#### 1. 创建配置

```http
POST /api/llm/config
Content-Type: application/json

{
  "name": "DeepSeek 配置",
  "provider": "deepseek",
  "modelId": "deepseek-chat",
  "apiKey": "sk-xxx",
  "apiEndpoint": "https://api.deepseek.com/v1",
  "isDefault": true
}
```

#### 2. 获取所有配置

```http
GET /api/llm/config?provider=deepseek&activeOnly=true&page=1&limit=10
```

#### 3. 获取默认配置

```http
GET /api/llm/config/default
```

#### 4. 更新配置

```http
PUT /api/llm/config/:id
Content-Type: application/json

{
  "temperature": 0.8
}
```

#### 5. 删除配置

```http
DELETE /api/llm/config/:id
```

#### 6. 设置默认配置

```http
POST /api/llm/config/:id/set-default
```

## 环境变量配置

```env
LLM_DEEPSEEK_API_KEY=your-deepseek-api-key-here
LLM_OPENAI_API_KEY=your-openai-api-key-here
LLM_MINIMAX_API_KEY=your-minimax-api-key-here
LLM_OLLAMA_API_ENDPOINT=http://localhost:11434/api
LLM_TIMEOUT=30000
LLM_MAX_RETRIES=3
```

## 使用示例

### 在服务中注入使用

```typescript
import { Injectable } from "@nestjs/common";
import { LLMService } from "./llm/llm.service";

@Injectable()
export class MyService {
  constructor(private readonly llmService: LLMService) {}

  async generateResponse(prompt: string) {
    const response = await this.llmService.call({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return response.choices[0].message.content;
  }
}
```

### 使用指定提供商

```typescript
const response = await this.llmService.callWithProvider("openai", {
  messages: [{ role: "user", content: "请用英文回答" }],
});
```

### 流式调用

```typescript
for await (const chunk of await this.llmService.stream(request)) {
  console.log(chunk);
}
```

## 重试机制

服务内置了指数退避重试机制：

- 初始延迟: 1秒
- 最大延迟: 10秒
- 最大重试次数: 3次

## 健康检查

系统会自动检查所有注册的LLM服务：

```typescript
const statuses = await this.factory.getHealthStatus();
```

## 指标收集

系统自动收集以下指标：

- 总调用次数
- 成功调用次数
- 失败调用次数
- 平均延迟
- 最后调用时间

## 扩展开发

### 添加新的提供商

1. 在 `providers/` 目录下创建新的提供商实现
2. 继承 `AbstractLLMProvider` 和 `AbstractLLMService`
3. 在 `LLMFactoryService` 中注册新的提供商

```typescript
@Injectable()
export class MyProvider extends AbstractLLMProvider {
  readonly name = "MyProvider";
  readonly id = "my-provider" as const;

  createService(config: ILLMConfigDto): MyService {
    return new MyService(config);
  }

  protected getDefaultApiEndpoint(): string {
    return "https://api.my-provider.com/v1";
  }
}
```

## 注意事项

1. 配置管理 API 需要 JWT 认证
2. API Key 在响应中会被脱敏处理
3. 生产环境请配置有效的 API Key
4. 定期检查服务健康状态
