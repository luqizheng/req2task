import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LLMStreamRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  title?: string;
  conversationId?: string;
}

export interface LLMStreamChunk {
  type: 'conversation_start' | 'content' | 'message' | 'done' | 'error';
  conversationId?: string;
  isNewConversation?: boolean;
  content?: string;
  messageData?: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    createdAt: string;
  };
  followUpQuestions?: string[];
  keyElements?: string[];
  message?: string;
  extractedData?: Record<string, unknown>;
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
    this.baseUrl = process.env['AI_CHAT_SERVICE_URL'] || 'http://localhost:4001';
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
        'Starting LLM SSE stream request',
      );

      this.httpService
        .post(
          `${this.baseUrl}/api/ai/conversations/start`,
          {
            title: request.title,
            systemPrompt: request.systemPrompt,
            content: request.userPrompt,
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
              this.logger.debug('SSE stream ended');
              subscriber.complete();
            });

            stream.on('error', (error: Error) => {
              this.logger.error({ error }, 'SSE stream error');
              subscriber.error(error);
            });
          },
          error: (error: Error) => {
            this.logger.error({ error }, 'SSE stream request error');
            subscriber.error(error);
          },
        });

      return () => {
        controller.abort();
      };
    });
  }

  async generate(request: LLMStreamRequest): Promise<LLMStreamResult> {
    return new Promise((resolve, reject) => {
      let content = '';
      let conversationId: string | undefined;
      const followUpQuestions: string[] = [];
      const keyElements: string[] = [];

      this.streamGenerate(request).subscribe({
        next: (chunk) => {
          if (chunk.type === 'conversation_start') {
            conversationId = chunk.conversationId;
          } else if (chunk.type === 'content' && chunk.content) {
            content += chunk.content;
          } else if (chunk.type === 'message' && chunk.messageData) {
            content = chunk.messageData.content;
          } else if (chunk.type === 'done') {
            if (chunk.followUpQuestions) {
              followUpQuestions.push(...chunk.followUpQuestions);
            }
            if (chunk.keyElements) {
              keyElements.push(...chunk.keyElements);
            }
          } else if (chunk.type === 'error') {
            reject(new Error(chunk.message || 'SSE stream error'));
          }
        },
        error: (error) => {
          reject(error);
        },
        complete: () => {
          resolve({
            content,
            conversationId,
            followUpQuestions,
            keyElements,
          });
        },
      });
    });
  }

  generateStream(request: LLMStreamRequest): Observable<string> {
    return this.streamGenerate(request).pipe(
      map((chunk) => {
        if (chunk.type === 'content' && chunk.content) {
          return chunk.content;
        }
        return '';
      }),
    );
  }
}
