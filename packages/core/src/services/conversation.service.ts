import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationStatus, MessageRole } from '@req2task/dto';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMessage } from '../entities/conversation-message.entity';
import { PromptService } from '../prompts/prompt.service';
import { LLMService } from '../ai/llm.service';
import { LLMMessage } from '../ai/llm-provider.interface';

export interface CreateConversationDto {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
}

export interface SendMessageResult {
  message: ConversationMessage;
  followUpQuestions: FollowUpQuestion[];
  extractedRequirements?: ExtractedRequirement[];
  isComplete: boolean;
}

export interface FollowUpQuestion {
  question: string;
  reason: string;
  targetAspect: string;
}

export interface ExtractedRequirement {
  content: string;
  type: string;
  priority: string;
  dependencies: string[];
  keywords: string[];
}

export interface ConversationListOptions {
  collectionId?: string;
  rawRequirementId?: string;
  status?: ConversationStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationMessage)
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly promptService: PromptService,
    private readonly llmService: LLMService,
  ) {}

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    const conversation = this.conversationRepo.create({
      collectionId: dto.collectionId || null,
      rawRequirementId: dto.rawRequirementId || null,
      title: dto.title || null,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
    });
    return this.conversationRepo.save(conversation);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
    });
  }

  async getConversations(options: ConversationListOptions): Promise<Conversation[]> {
    const query = this.conversationRepo.createQueryBuilder('conversation');

    if (options.collectionId) {
      query.andWhere('conversation.collection_id = :collectionId', { collectionId: options.collectionId });
    }
    if (options.rawRequirementId) {
      query.andWhere('conversation.raw_requirement_id = :rawRequirementId', { rawRequirementId: options.rawRequirementId });
    }
    if (options.status) {
      query.andWhere('conversation.status = :status', { status: options.status });
    }

    query.orderBy('conversation.created_at', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }
    if (options.offset) {
      query.skip(options.offset);
    }

    return query.getMany();
  }

  async getMessages(conversationId: string, limit = 100, offset = 0): Promise<ConversationMessage[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  async sendMessage(
    conversationId: string,
    content: string,
    configId?: string,
  ): Promise<SendMessageResult> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await this.saveMessage(conversationId, {
      role: MessageRole.USER,
      content,
    });

    const messages = await this.getMessages(conversationId);
    const historyText = this.formatHistory(messages);

    const followUpResult = await this.generateFollowUpQuestions(
      historyText,
      configId,
    );

    const assistantContent = await this.generateAssistantResponse(messages, configId);

    const assistantMessage = await this.saveMessage(conversationId, {
      role: MessageRole.ASSISTANT,
      content: assistantContent,
      metadata: { followUpQuestions: followUpResult.questions.map((q) => q.question) },
    });

    await this.conversationRepo.update(conversationId, {
      messageCount: conversation.messageCount + 2,
    });

    return {
      message: assistantMessage,
      followUpQuestions: followUpResult.questions,
      isComplete: followUpResult.isComplete,
    };
  }

  async updateConversation(
    id: string,
    updates: { status?: ConversationStatus; summary?: string },
  ): Promise<Conversation> {
    await this.conversationRepo.update(id, updates);
    return this.getConversation(id) as Promise<Conversation>;
  }

  async deleteConversation(id: string): Promise<void> {
    await this.conversationRepo.delete(id);
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

  private formatHistory(messages: ConversationMessage[]): string {
    return messages
      .map((m) => `${m.role === MessageRole.USER ? '用户' : '助手'}: ${m.content}`)
      .join('\n');
  }

  private async generateFollowUpQuestions(
    collectedInfo: string,
    configId?: string,
  ): Promise<{ questions: FollowUpQuestion[]; isComplete: boolean }> {
    try {
      const rendered = this.promptService.render('INTELLIGENT_FOLLOW_UP', {
        rawRequirement: '',
        collectedInfo,
        previousQuestions: '',
      });

      const messages: LLMMessage[] = [
        { role: 'system', content: rendered.systemPrompt },
        { role: 'user', content: rendered.userPrompt },
      ];

      const response = await this.llmService.chatWithConfig(
        messages,
        configId!,
        {
          temperature: rendered.temperature,
          maxTokens: rendered.maxTokens,
        },
      );

      const parsed = JSON.parse(response.content);
      return {
        questions: parsed.questions || [],
        isComplete: parsed.isComplete || false,
      };
    } catch {
      return { questions: [], isComplete: false };
    }
  }

  private async generateAssistantResponse(
    messages: ConversationMessage[],
    configId?: string,
  ): Promise<string> {
    try {
      const rendered = this.promptService.render('AI_CHAT_RESPONSE', {
        message: messages[messages.length - 1]?.content || '',
      });

      const llmMessages: LLMMessage[] = [
        { role: 'system', content: rendered.systemPrompt },
        { role: 'user', content: rendered.userPrompt },
      ];

      if (!configId) {
        return '无法生成回复：缺少 LLM 配置。';
      }

      const response = await this.llmService.chatWithConfig(
        llmMessages,
        configId,
        {
          temperature: rendered.temperature,
          maxTokens: rendered.maxTokens,
        },
      );

      return response.content;
    } catch {
      return '抱歉，我需要更多信息来帮助您。请继续描述您的需求。';
    }
  }

  private async generateSummary(conversationText: string): Promise<string> {
    try {
      const rendered = this.promptService.render('CONVERSATION_SUMMARY', {
        conversationText,
      });

      const messages: LLMMessage[] = [
        { role: 'system', content: rendered.systemPrompt },
        { role: 'user', content: rendered.userPrompt },
      ];

      const response = await this.llmService.chat(messages);
      return response.content;
    } catch {
      return '';
    }
  }
}
