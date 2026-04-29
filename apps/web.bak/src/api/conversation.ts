import api from './axios';
import { ConversationStatus } from '@req2task/dto';

export type MessageRole = 'user' | 'assistant' | 'system';

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

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  rawRequirementId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  collectionId?: string | null;
  rawRequirementId?: string | null;
  title?: string | null;
  status: ConversationStatus;
  questionCount: number;
  messageCount: number;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: ConversationMessage[];
}

export interface CreateConversationDto {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
}

export interface SendMessageDto {
  content: string;
  rawRequirementId?: string;
}

export interface UpdateConversationDto {
  status?: ConversationStatus;
  summary?: string;
}

export interface SendMessageResult {
  message: ConversationMessage;
  followUpQuestions: FollowUpQuestion[];
  extractedRequirements?: ExtractedRequirement[];
  isComplete: boolean;
  questionCount: number;
}

export interface ConversationListQuery {
  collectionId?: string;
  rawRequirementId?: string;
  status?: ConversationStatus;
  limit?: number;
  offset?: number;
}

export interface ConversationMessagesQuery {
  limit?: number;
  offset?: number;
}

export const conversationApi = {
  createConversation: (dto: CreateConversationDto): Promise<Conversation> => {
    return api.post('/conversations', dto);
  },

  getConversations: (query?: ConversationListQuery): Promise<Conversation[]> => {
    const params = new URLSearchParams();
    if (query?.collectionId) params.append('collectionId', query.collectionId);
    if (query?.rawRequirementId) params.append('rawRequirementId', query.rawRequirementId);
    if (query?.status) params.append('status', query.status);
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.offset) params.append('offset', String(query.offset));
    const queryString = params.toString();
    return api.get(`/conversations${queryString ? `?${queryString}` : ''}`);
  },

  getConversation: (id: string): Promise<Conversation> => {
    return api.get(`/conversations/${id}`);
  },

  updateConversation: (id: string, dto: UpdateConversationDto): Promise<Conversation> => {
    return api.patch(`/conversations/${id}`, dto);
  },

  deleteConversation: (id: string): Promise<void> => {
    return api.delete(`/conversations/${id}`);
  },

  sendMessage: (
    conversationId: string,
    dto: SendMessageDto,
    configId?: string
  ): Promise<SendMessageResult> => {
    const headers: Record<string, string> = {};
    if (configId) headers['X-AI-Config-Id'] = configId;
    return api.post(`/conversations/${conversationId}/messages`, dto, { headers });
  },

  getMessages: (
    conversationId: string,
    query?: ConversationMessagesQuery
  ): Promise<ConversationMessage[]> => {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.offset) params.append('offset', String(query.offset));
    const queryString = params.toString();
    return api.get(`/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`);
  },
};
