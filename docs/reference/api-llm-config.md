# LLM 配置管理 API

LLM 配置服务提供 AI 大模型的配置管理能力，支持多模型、多提供商配置。

**注意**：LLM 配置管理 API 仅在 ai-chat-service 提供，service 应用通过 HTTP 调用获取配置。

## 服务地址

| 服务 | 端口 | 说明 |
|------|------|------|
| ai-chat-service | 4001 | LLM 配置管理 API + AI 对话服务 |

---

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/api/llm-configs` | GET | 获取所有配置 |
| `/api/llm-configs` | POST | 创建配置 |
| `/api/llm-configs/:id` | GET | 获取单个配置 |
| `/api/llm-configs/:id` | PUT | 更新配置 |
| `/api/llm-configs/:id` | DELETE | 删除配置 |
| `/api/llm-configs/:id/test` | POST | 测试配置连接 |

---

## 获取所有配置

```http
GET /api/llm-configs
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "configs": [
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
    ],
    "total": 1
  }
}
```

---

## 创建配置

```http
POST /api/llm-configs
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
    "apiKey": "[ENCRYPTED]",
    "isDefault": true,
    "createdAt": "2026-04-20T10:00:00Z"
  }
}
```

---

## 获取单个配置

```http
GET /api/llm-configs/:id
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
    "apiKey": "[ENCRYPTED]",
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

---

## 更新配置

```http
PUT /api/llm-configs/:id
Content-Type: application/json

{
  "name": "更新后的名称",
  "temperature": 0.5,
  "maxTokens": 3000
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "更新后的名称",
    "provider": "openai",
    "modelName": "gpt-4",
    "apiKey": "[ENCRYPTED]",
    "maxTokens": 3000,
    "temperature": 0.5,
    "updatedAt": "2026-04-20T11:00:00Z"
  }
}
```

---

## 删除配置

```http
DELETE /api/llm-configs/:id
```

**响应：** `204 No Content`

**失败响应：**

```json
{
  "code": 1,
  "message": "LLM config not found"
}
```

---

## 测试配置连接

```http
POST /api/llm-configs/:id/test
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "success": true,
    "message": "Deepseek connection successful"
  }
}
```

**失败响应：**

```json
{
  "code": 1,
  "data": {
    "success": false,
    "message": "Connection failed: Invalid API key"
  }
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

### LlmConfigResponseDto

```typescript
interface LlmConfigResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
}
```

### LlmConfigDetailResponseDto

```typescript
interface LlmConfigDetailResponseDto extends LlmConfigResponseDto {
  apiKey: string | null;  // "[ENCRYPTED]" 或 null
}
```

### LlmConfigListResponseDto

```typescript
interface LlmConfigListResponseDto {
  configs: LlmConfigResponseDto[];
  total: number;
}
```

### CreateLlmConfigDto

```typescript
interface CreateLlmConfigDto {
  name: string;
  provider: LLMProviderType;
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  isDefault?: boolean;
}
```

### UpdateLlmConfigDto

```typescript
interface UpdateLlmConfigDto {
  name?: string;
  provider?: LLMProviderType;
  modelName?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  isActive?: boolean;
  isDefault?: boolean;
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

---

## 安全说明

### 加密存储

LLM 配置 API 使用 AES-256-CBC 加密 API Key：

- 加密密钥由环境变量 `LLM_CONFIG_ENCRYPTION_KEY` 提供
- 响应中 API Key 显示为 `[ENCRYPTED]`
- 测试连接时自动解密进行验证

### 环境变量

ai-chat-service 需要配置：

```env
LLM_CONFIG_ENCRYPTION_KEY=your-32-character-secret-key
```
