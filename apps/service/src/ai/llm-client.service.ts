import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';

export interface LLMStreamRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
}

export interface LLMStreamChunk {
  type: 'metadata' | 'content' | 'message' | 'done' | 'error';
  conversationId?: string;
  content?: string;
  message?: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  };
  error?: string;
}

export interface LLMStreamResult {
  content: string;
  conversationId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
}

@Injectable()
export class LLmClientService {
  private readonly logger = new Logger(LLmClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = (process.env['AI_CHAT_SERVICE_URL'] || 'http://localhost:4001');
  }

  streamGenerate(request: LLMStreamRequest): Observable<LLMStreamChunk> {
    return new Observable<LLMStreamChunk>((subscriber) => {
      const controller = new AbortController();

      this.logger.debug(
        { 
          hasSystemPrompt: !!request.systemPrompt,
          userPromptLength: request.userPrompt.length,
          temperature: request.temperature,
          maxTokens: request.maxTokens,
        },
        'Starting LLM stream request',
      );

      this.httpService
        .post(
          `${this.baseUrl}/${request.conversationId}/messages/stream`,
          {
            systemPrompt: request.systemPrompt,
            userPrompt: request.userPrompt,
            temperature: request.temperature ?? 0.7,
            maxTokens: request.maxTokens ?? 2000,
            conversationId: request.conversationId,
          },
          {
            responseType: 'stream',
            signal: controller.signal,
          },
        )
        .subscribe({
          next: (response) => {
            const stream = response.data as NodeJS.ReadableStream;
            let buffer = '';

            stream.on('data', (chunk: Buffer) => {
              buffer += chunk.toString();
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    subscriber.complete();
                    return;
                  }
                  try {
                    const parsed = JSON.parse(data) as LLMStreamChunk;
                    subscriber.next(parsed);
                  } catch {
                    this.logger.warn({ raw: data }, 'Failed to parse SSE data');
                  }
                }
              }
            });

            stream.on('end', () => {
              this.logger.debug('Stream ended');
              subscriber.complete();
            });

            stream.on('error', (error: Error) => {
              this.logger.error({ error }, 'Stream error');
              subscriber.error(error);
            });
          },
          error: (error: Error) => {
            this.logger.error({ error }, 'Stream request error');
            subscriber.error(error);
          },
        });

      return () => {
        controller.abort();
      };
    });
  }

  async generate(request: LLMStreamRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      let content = '';

      this.streamGenerate(request).subscribe({
        next: (chunk) => {
          if (chunk.type === 'content' && chunk.content) {
            content += chunk.content;
          } else if (chunk.type === 'message' && chunk.message) {
            content = chunk.message.content;
          }
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          resolve(content);
        },
      });
    });
  }
}
