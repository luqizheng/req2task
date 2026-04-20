import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';
import { LLMService } from './llm.service';
import { LLMMessage, StreamChunk } from './llm-provider.interface';
import {
  MessageRole,
  ConversationStatus,
  CreateConversationDto,
  SendMessageDto,
  SessionChatResultDto,
  SessionInfoDto,
  SessionFileContentDto,
  ConversationMessageDto,
  ConversationDto,
} from '@req2task/dto';
import { FileParserService } from './file-parser.service';

@Injectable()
export class AIConversationService {
  private readonly logger = new Logger(AIConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly llmService: LLMService,
    private readonly fileParser: FileParserService,
  ) {}

  async createSession(options: CreateConversationDto): Promise<ConversationDto> {
    const conversation = this.conversationRepo.create({
      title: options.title || null,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
      conversationType: options.type || 'general',
      metadata: options.metadata || null,
    });
    const saved = await this.conversationRepo.save(conversation);
    return {
      id: saved.id,
      title: saved.title,
      status: saved.status,
      conversationType: saved.conversationType,
      messageCount: saved.messageCount,
      summary: saved.summary,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async getSession(sessionId: string): Promise<ConversationDto | null> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: sessionId },
      relations: ['messages'],
    });
    if (!conversation) {
      return null;
    }
    return {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      conversationType: conversation.conversationType,
      messageCount: conversation.messageCount,
      summary: conversation.summary,
      metadata: conversation.metadata,
      nextConversationId: conversation.nextConversationId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages?.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        metadata: msg.metadata,
        createdAt: msg.createdAt,
      })),
    };
  }

  async getSessionInfo(sessionId: string): Promise<SessionInfoDto | null> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: sessionId },
    });
    if (!conversation) {
      return null;
    }
    return {
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async linkToNext(currentSessionId: string, nextSessionId: string): Promise<void> {
    await this.conversationRepo.update(currentSessionId, {
      nextConversationId: nextSessionId,
    });
  }

  async getNextSession(sessionId: string): Promise<Conversation | null> {
    const current = await this.conversationRepo.findOne({
      where: { id: sessionId },
    });
    if (!current?.nextConversationId) {
      return null;
    }
    return this.conversationRepo.findOne({
      where: { id: current.nextConversationId },
    });
  }

  async sendMessage(
    sessionId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): Promise<SessionChatResultDto> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: sessionId },
    });

    if (!conversation) {
      throw new BadRequestException('Session not found');
    }

    let content = dto.content;
    if (dto.files && dto.files.length > 0) {
      const parsedFiles = await Promise.all(
        dto.files.map((file) => this.fileParser.parse(file)),
      );
      content = this.buildMultimodalContent(dto.content, parsedFiles);
    }

    await this.saveMessage(sessionId, {
      role: MessageRole.USER,
      content,
    });

    const messages = await this.buildMessages(sessionId, content, systemPrompt);

    try {
      const response = await this.llmService.generate(messages, configId);

      const assistantMessage = await this.saveMessage(sessionId, {
        role: MessageRole.ASSISTANT,
        content: response.content,
      });

      await this.updateMessageCount(conversation);

      const parsed = this.parseAIResponse(response.content);

      return {
        conversationId: sessionId,
        messageId: assistantMessage.id,
        content: response.content,
        followUpQuestions: parsed.followUpQuestions,
        isComplete: parsed.isComplete,
        usage: response.usage,
      };
    } catch (error) {
      this.logger.error(`Failed to send message to session ${sessionId}`, error);
      throw error;
    }
  }

  async *streamMessage(
    sessionId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): AsyncGenerator<StreamChunk & { messageId?: string; conversationId?: string }> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: sessionId },
    });

    if (!conversation) {
      throw new BadRequestException('Session not found');
    }

    let content = dto.content;
    if (dto.files && dto.files.length > 0) {
      const parsedFiles = await Promise.all(
        dto.files.map((file) => this.fileParser.parse(file)),
      );
      content = this.buildMultimodalContent(dto.content, parsedFiles);
    }

    await this.saveMessage(sessionId, {
      role: MessageRole.USER,
      content,
    });

    const messages = await this.buildMessages(sessionId, content, systemPrompt);

    try {
      for await (const chunk of this.llmService.generateStream(messages, configId)) {
        if (chunk.content) {
          yield {
            ...chunk,
            conversationId: sessionId,
          };
        }
      }

      const latestMessages = await this.messageRepo.find({
        where: { conversationId: sessionId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (latestMessages.length > 0) {
        await this.updateMessageCount(conversation);
        const parsed = this.parseAIResponse(latestMessages[0].content);
        yield {
          content: JSON.stringify({ followUpQuestions: parsed.followUpQuestions, isComplete: parsed.isComplete }),
          done: true,
          conversationId: sessionId,
          messageId: latestMessages[0].id,
        } as StreamChunk & { messageId?: string; conversationId?: string };
      }
    } catch (error) {
      this.logger.error(`Failed to stream message to session ${sessionId}`, error);
      throw error;
    }
  }

  async getMessages(
    sessionId: string,
    limit = 100,
    offset = 0,
  ): Promise<ConversationMessageDto[]> {
    const messages = await this.messageRepo.find({
      where: { conversationId: sessionId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      rawRequirementId: msg.rawRequirementId,
      metadata: msg.metadata,
      createdAt: msg.createdAt,
    }));
  }

  async clearSession(sessionId: string): Promise<void> {
    await this.messageRepo.delete({ conversationId: sessionId });
    await this.conversationRepo.update(sessionId, {
      messageCount: 0,
    });
  }

  async archiveSession(sessionId: string): Promise<void> {
    await this.conversationRepo.update(sessionId, {
      status: ConversationStatus.ARCHIVED,
    });
  }

  private async saveMessage(
    sessionId: string,
    data: {
      role: MessageRole;
      content: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ConversationMessage> {
    const message = this.messageRepo.create({
      conversationId: sessionId,
      role: data.role,
      content: data.content,
      metadata: data.metadata || null,
    });
    return this.messageRepo.save(message);
  }

  private async buildMessages(
    sessionId: string,
    newContent: string,
    systemPrompt?: string,
  ): Promise<LLMMessage[]> {
    const history = await this.getMessages(sessionId);
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
