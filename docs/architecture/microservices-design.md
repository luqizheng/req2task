# 微服务架构设计 - 需求收集功能

## 1. 服务架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Web)                                │
│                  Vue 3 + Element Plus + AIChat UI                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP / SSE
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API Gateway / Main Service                           │
│                        (NestJS)                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   Auth       │ │  Projects    │ │ Requirements │ │  Collections │  │
│  │   Module     │ │   Module     │ │   Module     │ │   Module     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Internal HTTP / gRPC
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│    AI Chat Service      │           │  File Conversion Svc    │
│    (独立 HTTP 服务)      │           │    (独立 HTTP 服务)      │
│                         │           │                        │
│  • LLM 对话             │           │  • PDF → TXT           │
│  • 需求分析              │           │  • DOCX → TXT          │
│  • 追问生成              │           │  • Audio → TXT         │
│  • Stream 响应          │           │                        │
└─────────────────────────┘           └─────────────────────────┘
              │
              ▼
┌─────────────────────────┐
│      LLM Provider       │
│  (OpenAI / Ollama / ...)│
└─────────────────────────┘
```

---

## 2. 服务职责划分

### 2.1 Main Service (NestJS)

**职责**：
- 业务逻辑处理
- 数据持久化（PostgreSQL）
- 文件存储（MinIO）
- 权限控制
- 外部 API 聚合

**模块**：
| 模块 | 职责 |
|------|------|
| Auth | 认证授权 |
| Projects | 项目管理 |
| Requirements | 需求管理 |
| Collections | 需求收集（协调层）|
| Attachments | 附件管理 |
| Notifications | 通知 |

**与 AI 服务的通信**：
- 通过 HTTP 调用 AI Chat Service
- 传递对话上下文和配置

### 2.2 AI Chat Service (独立服务)

**职责**：
- LLM 对话管理
- 流式响应（Server-Sent Events）
- 对话历史存储
- 需求分析 Prompt 模板
- 追问生成逻辑

**技术栈**：
- Node.js + Express / Fastify
- LLM SDK（OpenAI SDK / Ollama SDK）
- Redis（对话缓存）
- PostgreSQL（对话持久化）

**API 设计**：

```typescript
// 创建对话
POST /api/ai/chat/conversations
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
POST /api/ai/chat/conversations/:id/messages
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
GET /api/ai/chat/conversations/:id/messages
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

**目录结构**：
```
apps/ai-chat/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── routes/
│   │   ├── conversations.ts
│   │   └── messages.ts
│   ├── services/
│   │   ├── llm.service.ts
│   │   ├── conversation.service.ts
│   │   └── prompt.service.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── stream.ts
├── package.json
└── tsconfig.json
```

### 2.3 File Conversion Service (独立服务)

**职责**：
- 文件格式检测
- 内容提取（PDF、DOCX）
- 音频转录（Whisper）
- 异步处理（队列）

**技术栈**：
- Node.js + Express / Fastify
- Bull（任务队列）+ Redis
- FFmpeg（音频预处理）
- Worker 进程池

**API 设计**：

```typescript
// 同步转换（小文件）
POST /api/convert/sync
Request: {
  file: string;  // base64
  mimeType: string;
  originalName: string;
}
Response: {
  success: boolean;
  text?: string;
  error?: string;
  duration: number;
}

// 异步转换（大文件）
POST /api/convert/async
Request: {
  file: string;  // base64 或 URL
  mimeType: string;
  originalName: string;
  callbackUrl?: string;  // 完成后回调
}
Response: {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

// 查询转换状态
GET /api/convert/jobs/:jobId
Response: {
  jobId: string;
  status: string;
  result?: {
    text: string;
    duration: number;
  };
  error?: string;
}
```

**目录结构**：
```
apps/file-conversion/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── routes/
│   │   └── convert.routes.ts
│   ├── services/
│   │   ├── pdf.service.ts
│   │   ├── docx.service.ts
│   │   ├── audio.service.ts
│   │   └── queue.service.ts
│   ├── workers/
│   │   └── conversion.worker.ts
│   └── types/
│       └── index.ts
├── package.json
└── tsconfig.json
```

---

## 3. 服务间通信

### 3.1 Main Service → AI Chat Service

```typescript
// service/src/ai/ai-chat-client.service.ts

@Injectable()
export class AICatChatClientService {
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.AI_CHAT_SERVICE_URL || 'http://localhost:4001';
  }

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    return this.httpService.post(`${this.baseUrl}/api/ai/chat/conversations`, dto);
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    configId?: string
  ): Promise<Observable<MessageEvent>> {
    return this.httpService.post(
      `${this.baseUrl}/api/ai/chat/conversations/${conversationId}/messages`,
      dto,
      { headers: configId ? { 'X-AI-Config-Id': configId } : {} }
    );
  }

  async *streamMessage(
    conversationId: string,
    dto: SendMessageDto,
    configId?: string
  ): AsyncGenerator<MessageChunk> {
    const response = await fetch(
      `${this.baseUrl}/api/ai/chat/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(configId ? { 'X-AI-Config-Id': configId } : {}),
        },
        body: JSON.stringify(dto),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.type === '[DONE]') return;
          yield data;
        }
      }
    }
  }
}
```

### 3.2 Main Service → File Conversion Service

```typescript
// service/src/file-conversion/file-conversion-client.service.ts

@Injectable()
export class FileConversionClientService {
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.FILE_CONVERSION_SERVICE_URL || 'http://localhost:4002';
  }

  async convertSync(file: Buffer, mimeType: string, originalName: string): Promise<string> {
    const base64 = file.toString('base64');
    const result = await this.httpService.post(`${this.baseUrl}/api/convert/sync`, {
      file: base64,
      mimeType,
      originalName,
    });

    if (!result.success) {
      throw new Error(result.error || 'Conversion failed');
    }

    return result.text;
  }

  async submitAsyncJob(
    file: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<string> {
    const base64 = file.toString('base64');
    const result = await this.httpService.post(`${this.baseUrl}/api/convert/async`, {
      file: base64,
      mimeType,
      originalName,
    });
    return result.jobId;
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.httpService.get(`${this.baseUrl}/api/convert/jobs/${jobId}`);
  }
}
```

---

## 4. 部署配置

### 4.1 Docker Compose

```yaml
version: '3.8'

services:
  # 现有服务
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: req2task
      POSTGRES_USER: req2task
      POSTGRES_PASSWORD: req2task

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  redis:
    image: redis:7-alpine

  # 新增服务
  ai-chat-service:
    build:
      context: ./apps/ai-chat
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://req2task:req2task@postgres:5432/req2task
      - REDIS_URL=redis://redis:6379
      - PORT=4001
    depends_on:
      - postgres
      - redis

  file-conversion-service:
    build:
      context: ./apps/file-conversion
    ports:
      - "4002:4002"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=4002
    depends_on:
      - redis
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # For FFmpeg

  # 主服务
  service:
    build:
      context: .
      dockerfile: Dockerfile.service
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://req2task:req2task@postgres:5432/req2task
      - MINIO_ENDPOINT=minio:9000
      - AI_CHAT_SERVICE_URL=http://ai-chat-service:4001
      - FILE_CONVERSION_SERVICE_URL=http://file-conversion-service:4002
    depends_on:
      - postgres
      - minio
      - ai-chat-service
      - file-conversion-service
```

---

## 5. 环境变量

### Main Service (.env)
```env
# 数据库
DATABASE_URL=postgres://req2task:req2task@localhost:5432/req2task

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=req2task

# 外部服务
AI_CHAT_SERVICE_URL=http://localhost:4001
FILE_CONVERSION_SERVICE_URL=http://localhost:4002

# JWT
JWT_SECRET=your-secret-key
```

### AI Chat Service (.env)
```env
PORT=4001
NODE_ENV=development

DATABASE_URL=postgres://req2task:req2task@localhost:5432/req2task_ai_chat
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=sk-xxx
OLLAMA_BASE_URL=http://localhost:11434

LOG_LEVEL=info
```

### File Conversion Service (.env)
```env
PORT=4002
NODE_ENV=development

REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=sk-xxx
WHISPER_MODEL=whisper-1

MAX_FILE_SIZE=52428800
ALLOWED_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/mpeg,audio/wav

LOG_LEVEL=info
```

---

## 6. Monorepo 结构更新

```
req2task/
├── apps/
│   ├── web/                 # Vue 3 前端
│   ├── service/             # NestJS 主服务
│   ├── ai-chat/             # NEW: AI Chat 独立服务
│   └── file-conversion/     # NEW: 文件转换服务
├── packages/
│   ├── core/                # 共享实体、服务
│   ├── dto/                 # 共享 DTO
│   ├── ai-chat/             # AIChat Vue 组件库
│   └── shared-types/        # 共享类型定义
├── docs/
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 7. 实施计划

### Phase 1: 服务框架 (本次迭代)
1. 创建 `apps/file-conversion` 服务框架
2. 创建 `apps/ai-chat-service` 服务框架
3. 实现基础 HTTP 路由
4. 添加 Docker 配置

### Phase 2: 核心功能
1. File Conversion Service - 实现 PDF/DOCX 转换
2. AI Chat Service - 实现基础对话
3. Main Service - 集成外部服务调用

### Phase 3: 高级功能
1. Audio 转录（Whisper）
2. 流式响应
3. 对话持久化
4. 需求分析 Prompt 优化
