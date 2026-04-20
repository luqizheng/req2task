# 服务间通信设计

## 1. 通信模式

Main Service 与其他服务之间采用 HTTP/REST 通信。

## 2. Main Service → AI Chat Service

```typescript
// service/src/ai/ai-chat-client.service.ts

@Injectable()
export class AICatChatClientService {
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.AI_CHAT_SERVICE_URL || 'http://localhost:4001';
  }

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    return this.httpService.post(`${this.baseUrl}/api/ai/conversations`, dto);
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    configId?: string
  ): Promise<Observable<MessageEvent>> {
    return this.httpService.post(
      `${this.baseUrl}/api/ai/conversations/${conversationId}/messages`,
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
      `${this.baseUrl}/api/ai/conversations/${conversationId}/messages`,
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

## 3. Main Service → File Conversion Service

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

## 4. 服务健康检查

各服务提供健康检查端点：

| 服务 | 端点 | 响应 |
|------|------|------|
| AI Chat Service | GET /health | `{ status, llmConfigured, databaseConnected }` |
| File Conversion Service | GET /health | `{ status }` |

## 5. 错误处理

- 超时：默认 30 秒，可配置
- 重试：失败请求自动重试 3 次
- 降级：服务不可用时返回友好错误
