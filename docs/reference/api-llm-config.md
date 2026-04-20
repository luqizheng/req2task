# LLM 配置管理 API

LLM 配置服务提供 AI 大模型的配置管理能力，支持多模型、多提供商配置。

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/ai/llm-configs` | GET | 获取所有配置 |
| `/ai/llm-configs` | POST | 创建配置 |
| `/ai/llm-configs/default` | GET | 获取默认配置 |
| `/ai/llm-configs/:id` | GET | 获取单个配置 |
| `/ai/llm-configs/:id` | PUT | 更新配置 |
| `/ai/llm-configs/:id` | DELETE | 删除配置 |
| `/ai/llm-configs/:id/set-default` | POST | 设置默认配置 |
| `/ai/llm-configs/health` | GET | 获取健康状态 |
| `/ai/llm/call` | POST | 调用默认 LLM |
| `/ai/llm/stream` | POST | 流式调用默认 LLM |
| `/ai/llm/call/:provider` | POST | 调用指定提供商 |

---

## 配置管理

### 获取所有配置

```http
GET /ai/llm-configs
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "OpenAI GPT-4",
      "providerType": "openai",
      "modelName": "gpt-4",
      "apiKey": "sk-***",
      "baseUrl": "https://api.openai.com/v1",
      "isDefault": true,
      "temperature": 0.7,
      "maxTokens": 2000,
      "timeout": 30000,
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 创建配置

```http
POST /ai/llm-configs
Content-Type: application/json

{
  "name": "OpenAI GPT-4",
  "providerType": "openai",
  "modelName": "gpt-4",
  "apiKey": "sk-xxx",
  "baseUrl": "https://api.openai.com/v1",   // 可选
  "temperature": 0.7,                         // 可选，默认0.7
  "maxTokens": 2000,                         // 可选
  "timeout": 30000,                          // 可选
  "isDefault": true                          // 可选，是否设为默认
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "OpenAI GPT-4",
    "providerType": "openai",
    "modelName": "gpt-4",
    "isDefault": true,
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取单个配置

```http
GET /ai/llm-configs/:id
```

### 更新配置

```http
PUT /ai/llm-configs/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "temperature": 0.5,
  "maxTokens": 3000
}
```

### 删除配置

```http
DELETE /ai/llm-configs/:id
```

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 设置默认配置

```http
POST /ai/llm-configs/:id/set-default
```

### 获取默认配置

```http
GET /ai/llm-configs/default
```

---

## 健康检查

### 获取健康状态

```http
GET /ai/llm-configs/health
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "status": "healthy",
    "providers": [
      {
        "type": "openai",
        "available": true,
        "latency": 150
      },
      {
        "type": "deepseek",
        "available": false,
        "error": "API key invalid"
      }
    ]
  }
}
```

---

## LLM 调用

### 调用默认 LLM

```http
POST /ai/llm/call
Content-Type: application/json

{
  "messages": [
    { "role": "system", "content": "你是一个助手" },
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,       // 可选
  "maxTokens": 1000        // 可选
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "content": "你好！有什么可以帮助你的吗？",
    "usage": {
      "promptTokens": 20,
      "completionTokens": 15,
      "totalTokens": 35
    },
    "finishReason": "stop"
  }
}
```

### 流式调用默认 LLM

```http
POST /ai/llm/stream
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "写一首诗" }
  ]
}
```

**响应（text/event-stream）：**

```
data: {"content": "春", "done": false}
data: {"content": "眠", "done": false}
data: {"content": "不觉", "done": false}
data: {"content": "晓，", "done": false}
...
data: {"content": "处处闻啼鸟。", "done": true, "usage": {...}}
```

### 调用指定提供商

```http
POST /ai/llm/call/:provider
Content-Type: application/json

{
  "messages": [...],
  "configId": "uuid"      // 可选，不传则使用该提供商的默认配置
}
```

---

## 数据模型

### ProviderType 枚举

```typescript
type ProviderType = 'openai' | 'azure' | 'anthropic' | 'deepseek' | 'ollama';
```

| 值 | 说明 |
|----|------|
| `openai` | OpenAI GPT 系列 |
| `azure` | Azure OpenAI |
| `anthropic` | Anthropic Claude |
| `deepseek` | DeepSeek |
| `ollama` | Ollama 本地模型 |

### LLMConfig 类型

```typescript
interface LLMConfig {
  id: string;
  name: string;
  providerType: ProviderType;
  modelName: string;
  apiKey: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### LLMMessage 类型

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### LLMResponse 类型

```typescript
interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}
```

---

## 配置示例

### OpenAI 配置

```json
{
  "name": "OpenAI GPT-4",
  "providerType": "openai",
  "modelName": "gpt-4",
  "apiKey": "sk-xxx",
  "baseUrl": "https://api.openai.com/v1",
  "temperature": 0.7,
  "maxTokens": 2000,
  "timeout": 30000
}
```

### DeepSeek 配置

```json
{
  "name": "DeepSeek Chat",
  "providerType": "deepseek",
  "modelName": "deepseek-chat",
  "apiKey": "sk-xxx",
  "baseUrl": "https://api.deepseek.com",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### Ollama 本地配置

```json
{
  "name": "Ollama Local",
  "providerType": "ollama",
  "modelName": "llama3",
  "apiKey": "",
  "baseUrl": "http://localhost:11434",
  "temperature": 0.7,
  "maxTokens": 2000
}
```
