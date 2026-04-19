import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';
import { LLMService } from './llm.service';
import { LLMMessage, StreamChunk } from './llm-provider.interface';
import { MessageRole, ConversationStatus } from '@req2task/dto';
import { FileParserService } from './file-parser.service';

export interface ChatContext {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

export interface SendMessageDto {
  content: string;
  files?: FileContent[];
}

export interface FileContent {
  type: 'text' | 'docx' | 'pdf' | 'audio';
  data: string;
  name?: string;
}

export interface ChatResult {
  conversationId: string;
  messageId: string;
  content: string;
  followUpQuestions?: string[];
  isComplete?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChatResult {
  conversationId: string;
  messageId: string;
  followUpQuestions?: string[];
  isComplete?: boolean;
}

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly llmService: LLMService,
    private readonly fileParser: FileParserService,
  ) {}

  async createConversation(context: ChatContext): Promise<Conversation> {
    const conversation = this.conversationRepo.create({
      collectionId: context.collectionId || null,
      rawRequirementId: context.rawRequirementId || null,
      title: context.title || null,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
    });
    return this.conversationRepo.save(conversation);
  }

  async getOrCreateConversation(context: ChatContext): Promise<Conversation> {
    if (context.rawRequirementId) {
      const existing = await this.conversationRepo.findOne({
        where: {
          rawRequirementId: context.rawRequirementId,
          status: ConversationStatus.ACTIVE,
        },
      });
      if (existing) {
        return existing;
      }
    }
    return this.createConversation(context);
  }

  async sendMessage(
    conversationId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): Promise<ChatResult> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    let content = dto.content;
    if (dto.files && dto.files.length > 0) {
      const parsedFiles = await Promise.all(
        dto.files.map((file) => this.fileParser.parse(file)),
      );
      content = this.buildMultimodalContent(dto.content, parsedFiles);
    }

    await this.saveMessage(conversationId, {
      role: MessageRole.USER,
      content,
    });

    const messages = await this.buildMessages(conversationId, content, systemPrompt);

    try {
      const response = await this.llmService.generate(messages, configId);

      const assistantMessage = await this.saveMessage(conversationId, {
        role: MessageRole.ASSISTANT,
        content: response.content,
      });

      await this.updateMessageCount(conversation);

      const parsed = this.parseAIResponse(response.content);

      return {
        conversationId,
        messageId: assistantMessage.id,
        content: response.content,
        followUpQuestions: parsed.followUpQuestions,
        isComplete: parsed.isComplete,
        usage: response.usage,
      };
    } catch (error) {
      this.logger.error(`Failed to send message to conversation ${conversationId}`, error);
      throw error;
    }
  }

  async *streamMessage(
    conversationId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): AsyncGenerator<StreamChunk & { messageId?: string; conversationId?: string }> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    let content = dto.content;
    if (dto.files && dto.files.length > 0) {
      const parsedFiles = await Promise.all(
        dto.files.map((file) => this.fileParser.parse(file)),
      );
      content = this.buildMultimodalContent(dto.content, parsedFiles);
    }

    await this.saveMessage(conversationId, {
      role: MessageRole.USER,
      content,
    });

    const messages = await this.buildMessages(conversationId, content, systemPrompt);

    let messageId: string | undefined;

    try {
      for await (const chunk of this.llmService.generateStream(messages, configId)) {
        if (chunk.content) {
          yield {
            ...chunk,
            conversationId,
            messageId,
          };
        }
      }

      const latestMessages = await this.messageRepo.find({
        where: { conversationId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (latestMessages.length > 0) {
        messageId = latestMessages[0].id;
        await this.updateMessageCount(conversation);
        const parsed = this.parseAIResponse(latestMessages[0].content);
        yield {
          content: JSON.stringify({ followUpQuestions: parsed.followUpQuestions, isComplete: parsed.isComplete }),
          done: true,
          conversationId,
          messageId: latestMessages[0].id,
        } as StreamChunk & { messageId?: string; conversationId?: string };
      }
    } catch (error) {
      this.logger.error(`Failed to stream message to conversation ${conversationId}`, error);
      throw error;
    }
  }

  async getMessages(
    conversationId: string,
    limit = 100,
    offset = 0,
  ): Promise<ConversationMessage[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  async clearConversation(conversationId: string): Promise<void> {
    await this.messageRepo.delete({ conversationId });
    await this.conversationRepo.update(conversationId, {
      messageCount: 0,
    });
  }

  private async saveMessage(
    conversationId: string,
    data: {
      role: MessageRole;
      content: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ConversationMessage> {
    const message = this.messageRepo.create({
      conversationId,
      role: data.role,
      content: data.content,
      metadata: data.metadata || null,
    });
    return this.messageRepo.save(message);
  }

  private async buildMessages(
    conversationId: string,
    newContent: string,
    systemPrompt?: string,
  ): Promise<LLMMessage[]> {
    const history = await this.getMessages(conversationId);
    const messages: LLMMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of history) {
      messages.push({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: newContent });

    return messages;
  }

  private buildMultimodalContent(
    text: string,
    parsedFiles: { content: string; type: string }[],
  ): string {
    const parts: string[] = [text];

    for (const file of parsedFiles) {
      if (file.type === 'text') {
        parts.push(`\n【文件内容 - ${file.type}】\n${file.content}\n`);
      } else {
        parts.push(`\n【文件内容】\n${file.content}\n`);
      }
    }

    return parts.join('\n');
  }

  private async updateMessageCount(conversation: Conversation): Promise<void> {
    const count = await this.messageRepo.count({
      where: { conversationId: conversation.id },
    });

    await this.conversationRepo.update(conversation.id, {
      messageCount: count,
    });
  }

  private parseAIResponse(content: string): { followUpQuestions: string[]; isComplete: boolean } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
          isComplete: parsed.isComplete || parsed.followUpQuestions?.length === 0 || false,
        };
      }
    } catch {
      this.logger.debug('Failed to parse AI response as JSON');
    }

    return { followUpQuestions: [], isComplete: false };
  }
}
