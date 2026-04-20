import { Repository, DataSource } from 'typeorm';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity.js';
import { ConversationMessage } from '../database/entities/conversation-message.entity.js';
import type { CreateConversationRequest, ConversationMetadata } from '../types.js';
import type { ConversationListResponseDto, MessageListResponseDto } from '@req2task/dto';
import { MessageRole } from '@req2task/dto';

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的需求分析师，帮助用户澄清和完善需求。
请遵循以下原则：
1. 仔细分析用户描述的需求，提取关键要素
2. 当需求不明确时，主动提出追问问题
3. 每次回复控制在合理长度，聚焦当前话题
4. 使用清晰、专业的语言
5. 在适当时机总结关键要素，帮助用户确认理解正确`;

export class ConversationService {
  private conversationRepo: Repository<Conversation>;
  private messageRepo: Repository<ConversationMessage>;

  constructor(dataSource: DataSource) {
    this.conversationRepo = dataSource.getRepository(Conversation);
    this.messageRepo = dataSource.getRepository(ConversationMessage);
  }

  async create(data: CreateConversationRequest): Promise<Conversation> {
    const conversation = this.conversationRepo.create({
      title: data.title || `Chat ${new Date().toLocaleString('zh-CN')}`,
      collectionId: data.collectionId || null,
      rawRequirementId: data.rawRequirementId || null,
      systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
      metadata: {
        questionCount: 0,
        keyElements: [],
        followUpQuestions: [],
        isComplete: false,
      },
    });

    return this.conversationRepo.save(conversation);
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async getOrCreate(data: CreateConversationRequest): Promise<Conversation> {
    if (data.collectionId) {
      const existing = await this.findByCollectionId(data.collectionId);
      if (existing) return existing;
    }

    if (data.rawRequirementId) {
      const existing = await this.findByRawRequirementId(data.rawRequirementId);
      if (existing) return existing;
    }

    return this.create(data);
  }

  async findByCollectionId(collectionId: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { collectionId, status: ConversationStatus.ACTIVE },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async findByRawRequirementId(rawRequirementId: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { rawRequirementId, status: ConversationStatus.ACTIVE },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  async addMessage(
    conversationId: string,
    message: Omit<ConversationMessage, 'id' | 'conversationId' | 'conversation' | 'createdAt'>
  ): Promise<ConversationMessage> {
    const conversation = await this.conversationRepo.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const newMessage = this.messageRepo.create({
      conversationId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? null,
    });

    await this.messageRepo.save(newMessage);

    conversation.messageCount += 1;
    if (message.role === 'user') {
      const meta: ConversationMetadata = {
        questionCount: (conversation.metadata?.['questionCount'] as number) || 0,
        keyElements: (conversation.metadata?.['keyElements'] as string[]) || [],
        followUpQuestions: (conversation.metadata?.['followUpQuestions'] as string[]) || [],
        isComplete: (conversation.metadata?.['isComplete'] as boolean) || false,
      };
      meta.questionCount += 1;
      conversation.metadata = meta as unknown as Record<string, unknown>;
    }

    await this.conversationRepo.save(conversation);

    return newMessage;
  }

  async updateMetadata(
    conversationId: string,
    metadata: Partial<ConversationMetadata>
  ): Promise<void> {
    const conversation = await this.conversationRepo.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const existingMeta: ConversationMetadata = {
      questionCount: (conversation.metadata?.['questionCount'] as number) || 0,
      keyElements: (conversation.metadata?.['keyElements'] as string[]) || [],
      followUpQuestions: (conversation.metadata?.['followUpQuestions'] as string[]) || [],
      isComplete: (conversation.metadata?.['isComplete'] as boolean) || false,
    };

    conversation.metadata = {
      ...existingMeta,
      ...metadata,
    } as unknown as Record<string, unknown>;

    await this.conversationRepo.save(conversation);
  }

  async archive(id: string): Promise<void> {
    const conversation = await this.conversationRepo.findOneBy({ id });
    if (!conversation) {
      throw new Error(`Conversation ${id} not found`);
    }

    conversation.status = ConversationStatus.ARCHIVED;
    await this.conversationRepo.save(conversation);
  }

  async linkToNext(currentId: string, nextId: string): Promise<void> {
    const current = await this.conversationRepo.findOneBy({ id: currentId });
    if (!current) {
      throw new Error(`Conversation ${currentId} not found`);
    }

    current.nextConversationId = nextId;
    await this.conversationRepo.save(current);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.conversationRepo.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async list(limit = 100, offset = 0): Promise<ConversationListResponseDto> {
    const [conversations, total] = await this.conversationRepo.findAndCount({
      where: { status: ConversationStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        messageCount: c.messageCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total,
    };
  }

  async getMessages(
    conversationId: string,
    limit = 100,
    offset = 0
  ): Promise<MessageListResponseDto> {
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    return {
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role as MessageRole,
        content: m.content,
        metadata: m.metadata,
        createdAt: m.createdAt,
      })),
      total,
    };
  }
}
