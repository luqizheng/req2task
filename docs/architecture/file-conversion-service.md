# File Conversion Service 设计

## 1. 服务概述

File Conversion Service 是独立的 HTTP 服务，负责文件格式转换和内容提取。

## 2. 职责

- 文件格式检测
- 内容提取（PDF、DOCX）
- 音频转录（Whisper）
- 异步处理（队列）

## 3. 技术栈

- Node.js + Express / Fastify
- Bull（任务队列）+ Redis
- FFmpeg（音频预处理）
- Worker 进程池

## 4. API 设计

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

## 5. 支持的格式

| 格式 | 处理方式 | 说明 |
|------|----------|------|
| PDF | 流解析 | 提取 stream 中的 Tj 操作符文本 |
| DOCX | XML 解析 | 提取 `<w:t>` 标签内容 |
| TXT | 直接返回 | 纯文本内容 |
| Audio | Whisper | 需配置 OpenAI API Key |

## 6. 目录结构

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
│   │   ├── file-parser.service.ts
│   │   └── queue.service.ts
│   ├── workers/
│   │   └── conversion.worker.ts
│   └── types/
│       └── index.ts
├── package.json
└── tsconfig.json
```

## 7. 环境变量

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

## 8. 与 Main Service 通信

Main Service 通过 HTTP 调用 File Conversion Service：

```typescript
// 同步转换
POST /api/convert/sync
// 异步转换
POST /api/convert/async
// 查询状态
GET /api/convert/jobs/:jobId
```
