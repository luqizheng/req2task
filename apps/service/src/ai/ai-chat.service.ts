import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FileParserService, PromptService } from '@req2task/core';

export interface ChatContext {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

export interface SendMessageDto {
  content: string;
  files?: FileContent[];
  configId?: string;
}

export interface FileContent {
  type: 'text' | 'docx' | 'pdf' | 'audio';
  data: string;
  name?: string;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  rawRequirementId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  clarifiedContent?: string;
  isComplete?: boolean;
  error?: string;
}

export interface ChatResult {
  conversationId: string;
  messageId: string;
  content: string;
  followUpQuestions: string[];
  keyElements: string[];
  clarifiedContent?: string;
  rawRequirementId?: string;
}

export interface RequirementCollectDto {
  rawRequirement: string;
  projectContext?: string;
  previousQuestions?: Array<{ question: string; answer: string }>;
  configId?: string;
}

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface SendMessageResponse {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: {
    followUpQuestions?: string[];
    keyElements?: string[];
  };
}

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly fileParserService: FileParserService,
    private readonly promptService: PromptService,
  ) {
    this.baseUrl = process.env['AI_CHAT_SERVICE_URL'] || 'http://localhost:4001';
  }

  async chatWithRequirementPrompt(dto: RequirementCollectDto): Promise<ChatResult> {
    const rendered = this.promptService.render('RAW_REQUIREMENT_ANALYSIS', {
      rawRequirement: dto.rawRequirement,
      projectContext: dto.projectContext || '',
      previousQuestions: dto.previousQuestions || [],
    });

    this.logger.debug({ 
      systemPrompt: rendered.systemPrompt.substring(0, 100),
      userPrompt: rendered.userPrompt.substring(0, 200)
    }, 'Rendered requirement prompt');

    return {
      conversationId: '',
      messageId: '',
      content: `System: ${rendered.systemPrompt}\n\nUser: ${rendered.userPrompt}`,
      followUpQuestions: [],
      keyElements: [],
    };
  }

  async chatWithRequirementPromptStream(
    dto: RequirementCollectDto,
  ): Promise<{ systemPrompt: string; userPrompt: string }> {
    const rendered = this.promptService.render('RAW_REQUIREMENT_ANALYSIS', {
      rawRequirement: dto.rawRequirement,
      projectContext: dto.projectContext || '',
      previousQuestions: dto.previousQuestions || [],
    });

    return {
      systemPrompt: rendered.systemPrompt,
      userPrompt: rendered.userPrompt,
    };
  }

  async createConversation(context: ChatContext): Promise<{ id: string }> {
    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<{ id: string }>>(
        `${this.baseUrl}/api/ai/conversations`,
        {
          collectionId: context.collectionId,
          rawRequirementId: context.rawRequirementId,
          title: context.title,
          systemPrompt: context.systemPrompt,
        },
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create conversation');
    }
    return response.data.data!;
  }

  async getConversation(id: string): Promise<unknown> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<unknown>>(
        `${this.baseUrl}/api/ai/conversations/${id}`,
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to get conversation');
    }
    return response.data.data;
  }

  async getOrCreateConversation(context: ChatContext): Promise<{ id: string }> {
    if (context.collectionId) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<ApiResponse<{ conversations: Array<{ id: string }> }>>(
            `${this.baseUrl}/api/ai/conversations?collectionId=${context.collectionId}&limit=1`,
          ),
        );
        if (response.data.code === 0 && response.data.data?.conversations?.length) {
          return { id: response.data.data.conversations[0].id };
        }
      } catch {
        // Fall through to create new conversation
      }
    }
    return this.createConversation(context);
  }

  async getMessages(conversationId: string, limit = 100, offset = 0): Promise<{
    messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
    total: number;
  }> {
    const response = await firstValueFrom(
      this.httpService.get<ApiResponse<{
        messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
        total: number;
      }>>(
        `${this.baseUrl}/api/ai/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      ),
    );
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to get messages');
    }
    return response.data.data!;
  }

  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatResult> {
    const parsedFiles = await this.parseFiles(dto.files || []);
    const processedContent = this.buildPromptContent(dto.content, parsedFiles);

    const response = await firstValueFrom(
      this.httpService.post<ApiResponse<SendMessageResponse>>(
        `${this.baseUrl}/api/ai/conversations/${conversationId}/messages`,
        {
          content: processedContent,
          files: parsedFiles.length > 0 ? parsedFiles : undefined,
          configId: dto.configId,
        },
      ),
    );

    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to send message');
    }

    const result = response.data.data!;
    return {
      conversationId: result.conversationId,
      messageId: result.id,
      content: result.content,
      followUpQuestions: result.metadata?.followUpQuestions || [],
      keyElements: result.metadata?.keyElements || [],
    };
  }

  getStreamUrl(conversationId: string, dto: SendMessageDto): string {
    const params = new URLSearchParams();
    params.set('content', dto.content);
    if (dto.files) {
      params.set('files', JSON.stringify(dto.files));
    }
    if (dto.configId) {
      params.set('configId', dto.configId);
    }
    return `${this.baseUrl}/api/ai/conversations/${conversationId}/messages/stream?${params.toString()}`;
  }

  private async parseFiles(files: FileContent[]): Promise<FileContent[]> {
    const parsed: FileContent[] = [];
    for (const file of files) {
      try {
        const result = await this.fileParserService.parse(file);
        parsed.push({
          type: file.type,
          data: result.content,
          name: file.name,
        });
      } catch (error) {
        this.logger.warn(`Failed to parse file ${file.name}: ${error}`);
        parsed.push(file);
      }
    }
    return parsed;
  }

  private buildPromptContent(content: string, parsedFiles: FileContent[]): string {
    if (parsedFiles.length === 0) {
      return content;
    }

    const fileContents = parsedFiles
      .map((f, i) => `[附件 ${i + 1}] ${f.name || f.type}:\n${f.data}`)
      .join('\n\n');

    return `${content}\n\n--- 附件内容 ---\n${fileContents}`;
  }
}
