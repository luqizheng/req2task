# AI Chat Service 规格文档

## 1. 项目概述

### 项目名称
`@req2task/ai-chat-service`

### 核心定位
独立的 AI 对话微服务，负责接收客户端聊天请求、调用 LLM 生成响应、通过 SSE 返回流式结果，并持久化对话数据到 PostgreSQL 数据库。

### 目标用户
- 前端应用（Vue 3 Web）
- 其他需要 AI 对话能力的微服务

## 2. 技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| 运行时 | Node.js 20+ | ESM 模块支持 |
| 框架 | Express.js 4.x | 轻量 HTTP 服务器 |
| 数据库 | PostgreSQL + TypeORM | 持久化存储 |
| LLM | OpenAI API / Ollama | AI 能力 |
| 验证 | Zod | 请求参数校验 |
| 日志 | Pino | 结构化日志 |
| 工具 | TypeScript 5.x | 类型安全 |

## 3. 核心功能

### 3.1 对话管理

| API | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 创建对话 | POST | `/api/ai/conversations` | 创建新对话会话 |
| 获取对话 | GET | `/api/ai/conversations/:id` | 获取对话详情 |
| 列表对话 | GET | `/api/ai/conversations` | 列出用户所有对话 |
| 删除对话 | DELETE | `/api/ai/conversations/:id` | 删除对话 |
| 归档对话 | POST | `/api/ai/conversations/:id/archive` | 归档对话 |
| 链接对话 | POST | `/api/ai/conversations/:id/link/:nextId` | 链接到下一对话 |

### 3.2 消息交互

| API | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 发送消息 | POST | `/api/ai/conversations/:id/messages` | 非流式消息交互 |
| 流式消息 | POST | `/api/ai/conversations/:id/messages/stream` | SSE 流式响应 |
| 获取消息 | GET | `/api/ai/conversations/:id/messages` | 分页获取消息 |

### 3.3 LLM 配置管理

| API | 方法 | 路径 | 说明 |
|-----|------|------|------|
| 创建配置 | POST | `/api/ai/llm-configs` | 创建 LLM 配置 |
| 列表配置 | GET | `/api/ai/llm-configs` | 获取所有配置 |
| 获取配置 | GET | `/api/ai/llm-configs/:id` | 获取单个配置 |
| 更新配置 | PUT | `/api/ai/llm-configs/:id` | 更新配置 |
| 删除配置 | DELETE | `/api/ai/llm-configs/:id` | 删除配置 |
| 测试配置 | POST | `/api/ai/llm-configs/:id/test` | 测试 LLM 连接 |

### 3.4 SSE 流式响应协议

```typescript
// 事件类型
type StreamEvent =
  | { type: 'metadata', conversationId: string, messageId?: string }
  | { type: 'content', content: string }
  | { type: 'metadata', followUpQuestions?: string[], keyElements?: string[], isComplete?: boolean }
  | { type: 'done', content?: string }
  | { type: 'error', error: string }
  | '[DONE]' // 连接结束标识
```

## 4. 数据模型

### 4.1 Conversation 实体

```typescript
interface Conversation {
  id: string;                    // UUID 主键
  title: string | null;          // 对话标题
  collectionId: string | null;   // 关联集合 ID
  rawRequirementId: string | null; // 关联原始需求 ID
  status: 'active' | 'archived'; // 对话状态
  systemPrompt: string;          // 系统提示词
  messageCount: number;          // 消息计数
  summary: string | null;        // 对话摘要
  conversationType: string;      // 对话类型
  metadata: Record<string, unknown> | null; // 扩展元数据
  nextConversationId: string | null; // 下一对话 ID
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 ConversationMessage 实体

```typescript
interface ConversationMessage {
  id: string;              // UUID 主键
  conversationId: string;   // 外键
  role: 'user' | 'assistant' | 'system'; // 消息角色
  content: string;          // 消息内容
  metadata: Record<string, unknown> | null; // 消息元数据
  createdAt: Date;
}
```

### 4.3 LLMConfig 实体

```typescript
interface LLMConfig {
  id: string;                    // UUID 主键
  name: string;                  // 配置名称
  provider: 'openai' | 'deepseek' | 'ollama'; // LLM 提供商
  apiKey: string;                // API 密钥
  baseUrl?: string | null;      // 自定义 API 地址
  modelName: string;             // 模型名称
  maxTokens: number;            // 最大 token 数
  temperature: number;            // 温度参数
  topP: number;                 // Top-P 参数
  isActive: boolean;            // 是否启用
  isDefault: boolean;            // 是否默认配置
  createdAt: Date;
  updatedAt: Date;
}
```

## 5. API 请求/响应格式

### 5.1 创建对话

**请求**
```typescript
POST /api/ai/conversations
{
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}
```

**响应**
```typescript
{
  "code": 0,
  "data": { "id": "uuid" }
}
```

### 5.2 发送消息

**请求**
```typescript
POST /api/ai/conversations/:id/messages
{
  "content": "用户输入",
  "files": [
    { "type": "text" | "docx" | "pdf" | "audio", "data": "base64或文本", "name": "文件名" }
  ],
  "configId": "可选配置ID"
}
```

**响应**
```typescript
{
  "code": 0,
  "data": {
    "message": { "id": "uuid", "role": "assistant", "content": "AI回复" },
    "metadata": {
      "followUpQuestions": ["问题1", "问题2"],
      "keyElements": ["要素1", "要素2"]
    }
  }
}
```

### 5.3 SSE 流式响应

```bash
data: {"type":"metadata","conversationId":"uuid","messageId":"uuid"}

data: {"type":"content","content":"AI回"}

data: {"type":"content","content":"复中"}

data: {"type":"metadata","followUpQuestions":["追问1"],"keyElements":["要素"],"isComplete":false}

data: [DONE]
```

## 6. 数据库配置

### 6.1 环境变量

```bash
# 数据库
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ai_chat

# LLM
OPENAI_API_KEY=sk-xxx
DEFAULT_MODEL=gpt-4o-mini
```

### 6.2 迁移策略

- 使用 TypeORM 迁移命令管理数据库变更
- 迁移文件存储在 `src/database/migrations/`
- 开发环境自动同步 schema（开发模式）

## 7. 项目结构

```
apps/ai-chat-service/
├── src/
│   ├── main.ts                    # 入口文件
│   ├── app.ts                     # Express 应用配置
│   ├── config/
│   │   └── index.ts               # 配置加载
│   ├── database/
│   │   ├── index.ts               # 数据库连接
│   │   ├── entities/              # TypeORM 实体
│   │   │   ├── conversation.entity.ts
│   │   │   └── conversation-message.entity.ts
│   │   └── migrations/            # 数据库迁移
│   ├── routes/
│   │   └── conversation.routes.ts # 路由定义
│   ├── services/
│   │   ├── conversation.service.ts # 对话业务逻辑
│   │   └── llm.service.ts         # LLM 调用
│   ├── types.ts                   # 类型定义
│   └── utils/
│       └── logger.ts              # 日志工具
├── .env.example
├── package.json
├── tsconfig.json
└── SPEC.md
```

## 8. 配置优先级

1. 环境变量（`.env` 文件）
2. 默认值（代码中定义）

## 9. 错误处理

| HTTP 状态码 | 场景 |
|------------|------|
| 400 | 请求参数校验失败 |
| 401 | 未认证（预留） |
| 404 | 对话不存在 |
| 500 | 内部服务器错误 |

## 10. 性能考虑

- SSE 连接保持长连接，设置合适的超时时间
- 数据库连接池优化
- 消息分页查询（默认 100 条）
