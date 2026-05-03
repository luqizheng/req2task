# LLM 配置 API

AI Chat 服务提供的 LLM 配置管理接口。

**基础路径**: `/api/ai/llm-configs`

---

## 端点总览

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/api/ai/llm-configs` | GET | 获取配置列表 |
| `/api/ai/llm-configs` | POST | 创建配置 |
| `/api/ai/llm-configs/:id` | GET | 获取配置详情 |
| `/api/ai/llm-configs/:id` | PUT | 更新配置 |
| `/api/ai/llm-configs/:id` | DELETE | 删除配置 |

---

## 配置管理

### 获取配置列表

```http
GET /api/ai/llm-configs
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
        "modelName": "gpt-4o",
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "sk-****",
        "isDefault": true,
        "createdAt": "2026-04-20T10:00:00Z",
        "updatedAt": "2026-04-20T12:00:00Z"
      }
    ],
    "total": 5
  },
  "success": true
}
```

### 创建配置

```http
POST /api/ai/llm-configs
Content-Type: application/json

{
  "name": "配置名称",
  "modelName": "gpt-4o-mini",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "isDefault": false
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "配置名称",
    "modelName": "gpt-4o-mini",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-****",
    "isDefault": false,
    "createdAt": "2026-04-20T10:00:00Z"
  },
  "success": true
}
```

### 获取配置详情

```http
GET /api/ai/llm-configs/:id
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "配置名称",
    "modelName": "gpt-4o-mini",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-****",
    "isDefault": false,
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T12:00:00Z"
  },
  "success": true
}
```

### 更新配置

```http
PUT /api/ai/llm-configs/:id
Content-Type: application/json

{
  "name": "新名称",
  "modelName": "gpt-4o",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "isDefault": true
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "name": "新名称",
    "modelName": "gpt-4o",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-****",
    "isDefault": true,
    "updatedAt": "2026-04-20T12:00:00Z"
  },
  "success": true
}
```

### 删除配置

```http
DELETE /api/ai/llm-configs/:id
```

**响应：** 204 No Content

---

## 数据模型

### LLMConfig

```typescript
interface LLMConfig {
  id: string;
  name: string;
  modelName: string;
  baseUrl?: string;
  apiKey?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 支持的模型

| 模型名称 | 说明 |
|----------|------|
| `gpt-4o` | OpenAI GPT-4o |
| `gpt-4o-mini` | OpenAI GPT-4o Mini |
| `claude-3-opus` | Anthropic Claude 3 Opus |
| `claude-3-sonnet` | Anthropic Claude 3 Sonnet |
| `deepseek-chat` | DeepSeek Chat |
| `qwen-turbo` | 通义千问 Turbo |
