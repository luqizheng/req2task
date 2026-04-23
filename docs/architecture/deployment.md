# 部署配置

## 1. Docker Compose

```yaml
version: '3.8'

services:
  # 基础设施服务
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: req2task
      POSTGRES_USER: req2task
      POSTGRES_PASSWORD: req2task
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # AI Chat Service
  ai-chat-service:
    build:
      context: ./apps/ai-chat-service
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

  # File Conversion Service
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

  # Main Service
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

  # Frontend
  web:
    build:
      context: ./apps/web
    ports:
      - "5173:80"
    depends_on:
      - service

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

## 2. 环境变量

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

DATABASE_URL=postgres://req2task:req2task@localhost:5432/req2task
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

## 3. 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| Main Service | 3000 | API 网关 |
| AI Chat Service | 4001 | AI 对话服务 |
| File Conversion Service | 4002 | 文件转换服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO | 9000/9001 | 对象存储 |
| Frontend | 5173 | 前端开发服务器 |
