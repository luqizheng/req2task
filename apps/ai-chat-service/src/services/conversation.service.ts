import { Repository, DataSource } from 'typeorm';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity.js';
import { ConversationMessage } from '../database/entities/conversation-message.entity.js';
import type { CreateConversationRequest } from '../types.js';
import type { ConversationListResponseDto, MessageListResponseDto } from '@req2task/dto';
import { MessageRole } from '@req2task/dto';
import { logger } from '../utils/logger.js';

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的 AI 助手。请遵循以下原则：
1. 仔细分析用户的问题，提供准确答案
2. 当问题不明确时，主动提出追问
3. 每次回复控制在合理长度，聚焦当前话题
4. 使用清晰、专业的语言`;

export class ConversationService {
  private conversationRepo: Repository<Conversation>;
  private messageRepo: Repository<ConversationMessage>;

  constructor(dataSource: DataSource) {
    this.conversationRepo = dataSource.getRepository(Conversation);
    this.messageRepo = dataSource.getRepository(ConversationMessage);
  }

  async create(data: CreateConversationRequest): Promise<Conversation> {
    logger.debug({ data }, 'Creating conversation');

    const title = data.title || `Chat ${new Date().toLocaleString('zh-CN')}`;
    const systemPrompt = data.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    logger.debug({ title, hasCustomSystemPrompt: !!data.systemPrompt }, 'Conversation params resolved');

    const conversation = this.conversationRepo.create({
      title,
      systemPrompt,
      status: ConversationStatus.ACTIVE,
      messageCount: 0,
      metadata: data.metadata || null,
    });

    const saved = await this.conversationRepo.save(conversation);

    logger.info({ conversationId: saved.id, title: saved.title }, 'Conversation created');
    return saved;
  }

  async getById(id: string): Promise<Conversation | null> {
    logger.debug({ conversationId: id }, 'Fetching conversation by id');

    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (conversation) {
      logger.debug({ conversationId: id, messageCount: conversation.messageCount }, 'Conversation found');
    } else {
      logger.debug({ conversationId: id }, 'Conversation not found');
    }

    return conversation;
  }

  async addMessage(
    conversationId: string,
    message: Omit<ConversationMessage, 'id' | 'conversationId' | 'conversation' | 'createdAt'>
  ): Promise<ConversationMessage> {
    logger.debug({ conversationId, role: message.role, contentLength: message.content.length }, 'Adding message to conversation');

    const conversation = await this.conversationRepo.findOneBy({ id: conversationId });
    if (!conversation) {
      logger.error({ conversationId }, 'Conversation not found when adding message');
      throw new Error(`Conversation ${conversationId} not found`);
    }

    logger.debug({ conversationId, currentMessageCount: conversation.messageCount }, 'Current message count');

    const newMessage = this.messageRepo.create({
      conversationId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ?? null,
    });

    const savedMessage = await this.messageRepo.save(newMessage);
    logger.debug({ messageId: savedMessage.id, conversationId }, 'Message saved');

    conversation.messageCount += 1;
    await this.conversationRepo.save(conversation);
    logger.debug({ conversationId, newMessageCount: conversation.messageCount }, 'Message count updated');

    return savedMessage;
  }

  async updateMetadata(
    conversationId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    logger.debug({ conversationId, metadata }, 'Updating conversation metadata');

    const conversation = await this.conversationRepo.findOneBy({ id: conversationId });
    if (!conversation) {
      logger.error({ conversationId }, 'Conversation not found when updating metadata');
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const oldMetadata = conversation.metadata;
    conversation.metadata = {
      ...(conversation.metadata || {}),
      ...metadata,
    };

    await this.conversationRepo.save(conversation);

    logger.info({ conversationId, oldMetadata, newMetadata: conversation.metadata }, 'Conversation metadata updated');
  }

  async archive(id: string): Promise<void> {
    logger.debug({ conversationId: id }, 'Archiving conversation');

    const conversation = await this.conversationRepo.findOneBy({ id });
    if (!conversation) {
      logger.error({ conversationId: id }, 'Conversation not found when archiving');
      throw new Error(`Conversation ${id} not found`);
    }

    const oldStatus = conversation.status;
    conversation.status = ConversationStatus.ARCHIVED;
    await this.conversationRepo.save(conversation);

    logger.info({ conversationId: id, oldStatus, newStatus: ConversationStatus.ARCHIVED }, 'Conversation archived');
  }

  async delete(id: string): Promise<boolean> {
    logger.debug({ conversationId: id }, 'Deleting conversation');

    const result = await this.conversationRepo.delete({ id });
    const deleted = (result.affected ?? 0) > 0;

    logger.info({ conversationId: id, affected: result.affected, deleted }, 'Conversation delete result');

    return deleted;
  }

  async list(limit = 100, offset = 0): Promise<ConversationListResponseDto> {
    logger.debug({ limit, offset }, 'Listing conversations');

    const [conversations, total] = await this.conversationRepo.findAndCount({
      where: { status: ConversationStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    logger.debug({ total, returned: conversations.length, limit, offset }, 'Conversations list result');

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
    logger.debug({ conversationId, limit, offset }, 'Fetching messages');

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });

    logger.debug({ conversationId, total, returned: messages.length }, 'Messages fetched');

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
