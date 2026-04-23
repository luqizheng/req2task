export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'done' | 'error';

export interface MessageMetadata {
  thinkingProcess?: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  [key: string]: unknown;
}

export interface AIChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  status?: MessageStatus;
  isStreaming?: boolean;
  roleName?: string;
  avatar?: string;
  metadata?: MessageMetadata;
}

export interface AIChatMessageInput {
  role: MessageRole;
  content: string;
  roleName?: string;
  avatar?: string;
  metadata?: MessageMetadata;
}
