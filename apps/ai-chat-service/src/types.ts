import { LLMProviderType } from '@req2task/dto';

export { LLMProviderType };

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title?: string;
  systemPrompt: string;
  messages: Message[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  content: string;
  files?: FileAttachment[];
  configId?: string;
}

export interface FileAttachment {
  type: 'text' | 'docx' | 'pdf' | 'audio';
  data: string;
  name?: string;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  messageId?: string;
  error?: string;
}

export interface CreateConversationRequest {
  title?: string;
  systemPrompt?: string;
  configId?: string;
  metadata?: Record<string, unknown>;
}

export interface LLMConfigMetadata {
  provider: LLMProviderType;
  modelName: string;
  baseUrl?: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}