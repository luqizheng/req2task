import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  SendMessageDto as SendMessageRequestDto,
  CreateConversationDto as CreateConversationRequestDto,
  CreateConversationResponseDto,
  ConversationDto,
  SendMessageResponseDto,
  ConversationListResponseDto,
  MessageRole,
} from '@req2task/dto';

export interface SendMessageDto {
  content: string;
  files?: Array<{ type: 'text' | 'docx' | 'pdf' | 'audio'; data: string; name?: string }>;
  configId?: string;
}

export interface CreateConversationDto {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  isComplete?: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

@Injectable()
export class AIChatClientService {
  private readonly logger = new Logger(AIChatClientService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env['AI_CHAT_SERVICE_URL'] || 'http://localhost:4001';
  }

  async createConversation(dto: CreateConversationDto): Promise<{ id: string }> {
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<{ id: string }>>(
        `${this.baseUrl}/api/ai/conversations`,
        dto,
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create conversation');
    }
    return response.data.data!;
  }

  async getConversation(id: string): Promise<ConversationDto> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<ConversationDto>>(
        `${this.baseUrl}/api/ai/conversations/${id}`,
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to get conversation');
    }
    return response.data.data!;
  }

  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<SendMessageResponseDto> {
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<SendMessageResponseDto>>(
        `${this.baseUrl}/api/ai/conversations/${conversationId}/messages`,
        dto,
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to send message');
    }
    return response.data.data!;
  }

  async getOrCreateConversation(dto: CreateConversationDto): Promise<{ id: string }> {
    try {
      if (dto.collectionId) {
        const response = await firstValueFrom(
          this.httpService.get<ApiResponse<ConversationListResponseDto>>(
            `${this.baseUrl}/api/ai/conversations?collectionId=${dto.collectionId}`,
          ),
        );
        if (response.data.code === 0 && response.data.data?.conversations.length) {
          return { id: response.data.data.conversations[0].id };
        }
      }
    } catch {
      // Fall through to create new conversation
    }
    return this.createConversation(dto);
  }

  getStreamUrl(conversationId: string, dto: SendMessageDto): string {
    const params = new URLSearchParams({
      content: dto.content,
    });
    if (dto.files) {
      params.set('files', JSON.stringify(dto.files));
    }
    if (dto.configId) {
      params.set('configId', dto.configId);
    }
    return `${this.baseUrl}/api/ai/conversations/${conversationId}/messages/stream`;
  }
}
