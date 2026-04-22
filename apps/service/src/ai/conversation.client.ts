import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationListResponseDto,
  CreateConversationResponseDto,
  ConversationDto,
  SendMessageResponseDto,
  MessageListResponseDto,
} from '@req2task/dto';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface StreamChunk {
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
  followUpQuestions?: string[];
  keyElements?: string[];
  error?: string;
}

@Injectable()
export class ConversationClient {
  private readonly logger = new Logger(ConversationClient.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env['AI_CHAT_SERVICE_URL'] || 'http://localhost:4001';
  }

  async create(dto: CreateConversationDto): Promise<CreateConversationResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<CreateConversationResponseDto>>(
          `${this.baseUrl}/api/ai/conversations`,
          dto,
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to create conversation');
      }

      this.logger.debug({ conversationId: response.data.data?.id }, 'Conversation created');
      return response.data.data!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message }, 'Create conversation error');
      throw error;
    }
  }

  async list(limit = 100, offset = 0): Promise<ConversationListResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ApiResponse<ConversationListResponseDto>>(
          `${this.baseUrl}/api/ai/conversations`,
          { params: { limit, offset } },
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to list conversations');
      }

      return response.data.data!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message }, 'List conversations error');
      throw error;
    }
  }

  async getById(id: string): Promise<ConversationDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ApiResponse<ConversationDto>>(
          `${this.baseUrl}/api/ai/conversations/${id}`,
        ),
      );

      if (response.data.code !== 0) {
        if (response.data.message === 'Conversation not found') {
          return null;
        }
        throw new Error(response.data.message || 'Failed to get conversation');
      }

      return response.data.data!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, conversationId: id }, 'Get conversation error');
      throw error;
    }
  }

  async getMessages(id: string, limit = 100, offset = 0): Promise<MessageListResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<ApiResponse<MessageListResponseDto>>(
          `${this.baseUrl}/api/ai/conversations/${id}/messages`,
          { params: { limit, offset } },
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to get messages');
      }

      return response.data.data!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, conversationId: id }, 'Get messages error');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete<ApiResponse<null>>(
          `${this.baseUrl}/api/ai/conversations/${id}`,
        ),
      );

      if (response.data.code !== 0) {
        if (response.data.message === 'Conversation not found') {
          return false;
        }
        throw new Error(response.data.message || 'Failed to delete conversation');
      }

      this.logger.debug({ conversationId: id }, 'Conversation deleted');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, conversationId: id }, 'Delete conversation error');
      throw error;
    }
  }

  async archive(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<null>>(
          `${this.baseUrl}/api/ai/conversations/${id}/archive`,
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to archive conversation');
      }

      this.logger.debug({ conversationId: id }, 'Conversation archived');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, conversationId: id }, 'Archive conversation error');
      throw error;
    }
  }

  async linkToNext(id: string, nextId: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<null>>(
          `${this.baseUrl}/api/ai/conversations/${id}/link/${nextId}`,
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to link conversations');
      }

      this.logger.debug({ currentId: id, nextId }, 'Conversations linked');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, currentId: id, nextId }, 'Link conversations error');
      throw error;
    }
  }

  async sendMessage(id: string, dto: SendMessageDto): Promise<SendMessageResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ApiResponse<SendMessageResponseDto>>(
          `${this.baseUrl}/api/ai/conversations/${id}/messages`,
          dto,
        ),
      );

      if (response.data.code !== 0) {
        throw new Error(response.data.message || 'Failed to send message');
      }

      this.logger.debug({ conversationId: id, messageId: response.data.data?.message?.id }, 'Message sent');
      return response.data.data!;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ error: message, conversationId: id }, 'Send message error');
      throw error;
    }
  }

  streamMessage(id: string, dto: SendMessageDto): Observable<StreamChunk> {
    return new Observable<StreamChunk>((subscriber) => {
      const controller = new AbortController();

      this.httpService
        .post(
          `${this.baseUrl}/api/ai/conversations/${id}/messages/stream`,
          dto,
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
                    const parsed = JSON.parse(data) as StreamChunk;
                    subscriber.next(parsed);
                  } catch {
                    this.logger.warn({ raw: data }, 'Failed to parse SSE data');
                  }
                }
              }
            });

            stream.on('end', () => {
              subscriber.complete();
            });

            stream.on('error', (error: Error) => {
              this.logger.error({ error, conversationId: id }, 'Stream error');
              subscriber.error(error);
            });
          },
          error: (error: Error) => {
            this.logger.error({ error, conversationId: id }, 'Stream request error');
            subscriber.error(error);
          },
        });

      return () => {
        controller.abort();
      };
    });
  }
}
