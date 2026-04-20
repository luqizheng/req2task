# LLM 配置管理 API

LLM 配置服务提供 AI 大模型的配置管理能力，支持多模型、多提供商配置。

**注意**：LLM 配置管理 API 仅在主服务 (service) 提供，ai-chat-service 通过 HTTP 调用获取配置。

## 服务地址

| 服务 | 端口 | 说明 |
|------|------|------|
| service | 4000 | LLM 配置管理 API |
| ai-chat-service | 4001 | AI 对话服务（调用 service 获取配置） |

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/ai/llm-configs` | GET | 获取所有配置 |
| `/ai/llm-configs` | POST | 创建配置 |
| `/ai/llm-configs/:id` | GET | 获取单个配置 |
| `/ai/llm-configs/:id` | PUT | 更新配置 |
| `/ai/llm-configs/:id` | DELETE | 删除配置 |
| `/ai/llm-configs/:id/test` | POST | 测试配置连接 |

---

## 配置管理

### 获取所有配置

```http
GET /ai/llm-configs
Authorization: Bearer <jwt-token>
```

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "OpenAI GPT-4",
      "provider": "openai",
      "modelName": "gpt-4",
      "baseUrl": "https://api.openai.com/v1",
      "maxTokens": 4096,
      "temperature": 0.7,
      "topP": 1.0,
      "isActive": true,
      "isDefault": true,
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 创建配置

```http
POST /ai/llm-configs
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "apiKey": "sk-xxx",
  "modelName": "gpt-4",
  "baseUrl": "https://api.openai.com/v1",
  "maxTokens": 4096,
  "temperature": 0.7,
  "topP": 1.0,
  "isActive": true,
  "isDefault": true
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "OpenAI GPT-4",
    "provider": "openai",
    "modelName": "gpt-4",
    "isDefault": true,
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

### 获取单个配置

```http
GET /ai/llm-configs/:id
Authorization: Bearer <jwt-token>
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "OpenAI GPT-4",
    "provider": "openai",
    "modelName": "gpt-4",
    "apiKey": "sk-***",
    "baseUrl": "https://api.openai.com/v1",
    "maxTokens": 4096,
    "temperature": 0.7,
    "topP": 1.0,
    "isActive": true,
    "isDefault": true,
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T10:00:00Z"
  }
}
```

### 更新配置

```http
PUT /ai/llm-configs/:id
Authorization: Bearer <jwt-token>
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
Authorization: Bearer <jwt-token>
```

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

### 测试配置连接

```http
POST /ai/llm-configs/:id/test
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "testMessage": "请回复'配置测试成功'"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "success": true,
    "content": "配置测试成功",
    "configId": "uuid",
    "latencyMs": 1500
  }
}
```

**失败响应：**

```json
{
  "code": 0,
  "data": {
    "success": false,
    "content": "",
    "configId": "uuid",
    "error": "API key invalid"
  }
}
```

---

## ai-chat-service 配置获取

ai-chat-service 在启动时通过 HTTP 调用 service 获取默认 LLM 配置：

```http
GET http://localhost:4000/ai/llm-configs
```

内部通过 `ServiceApiService` 实现：

```typescript
// ai-chat-service/src/services/service-api.service.ts
async getDefaultLLMConfig(): Promise<LLMConfigResponseDto | null> {
  const response = await fetch(`${this.baseUrl}/ai/llm-configs`);
  const result = await response.json();
  
  if (result.code !== 0 || !result.data?.configs) {
    return null;
  }

  const defaultConfig = result.data.configs.find(
    c => c.isDefault && c.isActive
  );
  return defaultConfig || null;
}
```

---

## 数据模型

### LLMProviderType 枚举

```typescript
enum LLMProviderType {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  OLLAMA = 'ollama'
}
```

| 值 | 说明 |
|----|------|
| `openai` | OpenAI GPT 系列 |
| `deepseek` | DeepSeek |
| `ollama` | Ollama 本地模型 |

### LLMConfigResponseDto

```typescript
interface LLMConfigResponseDto {
  id: string;
  name: string;
  provider: LLMProviderType;
  modelName: string;
  baseUrl: string | null;
  maxTokens: number;
  temperature: number;
  topP: number;
  isActive: boolean;
  isDefault: boolean;
  apiKey?: string;        // 仅在创建/更新时返回，查询时为 "********"
  createdAt: Date;
  updatedAt: Date;
}
```

### LLMConfigListResponseDto

```typescript
interface LLMConfigListResponseDto {
  configs: LLMConfigResponseDto[];
  total: number;
}
```

---

## 配置示例

### OpenAI 配置

```json
{
  "name": "OpenAI GPT-4",
  "provider": "openai",
  "apiKey": "sk-xxx",
  "modelName": "gpt-4",
  "baseUrl": "https://api.openai.com/v1",
  "maxTokens": 4096,
  "temperature": 0.7,
  "topP": 1.0,
  "isActive": true,
  "isDefault": true
}
```

### DeepSeek 配置

```json
{
  "name": "DeepSeek Chat",
  "provider": "deepseek",
  "apiKey": "sk-xxx",
  "modelName": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com",
  "maxTokens": 4096,
  "temperature": 0.7,
  "topP": 1.0,
  "isActive": true,
  "isDefault": false
}
```

### Ollama 本地配置

```json
{
  "name": "Ollama Local",
  "provider": "ollama",
  "apiKey": "",
  "modelName": "llama3",
  "baseUrl": "http://localhost:11434",
  "maxTokens": 4096,
  "temperature": 0.7,
  "topP": 1.0,
  "isActive": true,
  "isDefault": false
}
```
