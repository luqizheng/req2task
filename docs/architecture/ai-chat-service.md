# AI Chat Service 设计

## 1. 服务概述

AI Chat Service 是独立的 HTTP 服务，负责 LLM 对话管理和 AI 相关功能。

## 2. 职责

- LLM 对话管理
- 流式响应（Server-Sent Events）
- 对话历史存储
- 需求分析 Prompt 模板
- 追问生成逻辑
- **LLM 配置管理**（配置 CRUD、连接测试、健康检查）

## 3. 技术栈

- Node.js + Express / Fastify
- LLM SDK（OpenAI SDK / Ollama SDK）
- Redis（对话缓存）
- PostgreSQL（对话持久化）

## 4. API 设计

### 4.1 对话 API

```typescript
// 创建对话
POST /api/ai/conversations
Request: {
  collectionId?: string;
  rawRequirementId?: string;
  systemPrompt?: string;
  configId?: string;
}
Response: {
  id: string;
  createdAt: string;
}

// 发送消息
POST /api/ai/conversations/:id/messages
Request: {
  content: string;
  files?: Array<{
    type: 'text' | 'docx' | 'pdf' | 'audio';
    data: string;  // base64 或 URL
    name?: string;
  }>;
  configId?: string;
}
Response: SSE stream {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  isComplete?: boolean;
}

// 获取对话历史
GET /api/ai/conversations/:id/messages
Response: {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }>;
  metadata: {
    questionCount: number;
    keyElements: string[];
    followUpQuestions: string[];
  };
}
```

### 4.2 LLM 配置 API

**端点前缀**: `/api/ai/llm-configs`

```typescript
// 创建配置
POST /api/ai/llm-configs
Request: {
  name: string;
  provider: 'deepseek' | 'openai' | 'ollama' | 'minimax';
  modelName: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
}

// 获取所有配置
GET /api/ai/llm-configs

// 获取单个配置
GET /api/ai/llm-configs/:id

// 更新配置
PUT /api/ai/llm-configs/:id

// 删除配置
DELETE /api/ai/llm-configs/:id

// 测试配置连接
POST /api/ai/llm-configs/:id/test
Request: { testMessage?: string; }
Response: { success: boolean; content?: string; latencyMs: number; error?: string; }
```

### 4.3 文本处理 API

```typescript
// 文本处理
POST /api/ai/text/process
Request: {
  content: string;
  action: 'summarize' | 'extract' | 'transform';
  configId?: string;
}
Response: {
  result: string;
  metadata?: Record<string, unknown>;
}
```

## 5. 目录结构

```
apps/ai-chat-service/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── config/
│   │   └── index.ts
│   ├── routes/
│   │   ├── conversation.routes.ts
│   │   ├── llm-config.routes.ts
│   │   └── text.routes.ts
│   ├── services/
│   │   ├── llm.service.ts
│   │   ├── llm-config.service.ts
│   │   ├── conversation.service.ts
│   │   └── file-parser.service.ts
│   ├── database/
│   │   ├── data-source.ts
│   │   ├── entities/
│   │   │   ├── conversation.entity.ts
│   │   │   ├── conversation-message.entity.ts
│   │   │   └── llm-config.entity.ts
│   │   └── migrations/
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── stream.ts
├── package.json
└── tsconfig.json
```

## 6. 环境变量

```env
PORT=4001
NODE_ENV=development

DATABASE_URL=postgres://req2task:req2task@localhost:5432/req2task
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=sk-xxx
OLLAMA_BASE_URL=http://localhost:11434

LOG_LEVEL=info
```

## 7. 与 Main Service 通信

Main Service 通过 HTTP 调用 AI Chat Service：

```typescript
// 创建对话
POST /api/ai/conversations
// 发送消息
POST /api/ai/conversations/:id/messages
// LLM 配置
GET/POST/PUT/DELETE /api/ai/llm-configs
```
