import type { AIChatMessage } from './message';

export interface AIChatConfig {
  endpoint?: string;
  sessionId?: string;
  headers?: Record<string, string>;
  initialMessages?: AIChatMessage[];
  userRoleName?: string;
  userAvatar?: string;
  assistantRoleName?: string;
  assistantAvatar?: string;
  systemRoleName?: string;
}

export interface SendMessageOptions {
  message: string;
  conversationId?: string;
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (message: AIChatMessage, conversationId: string) => void;
  onError?: (error: Error) => void;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error' | 'metadata';
  content?: string;
  conversationId?: string;
  isNewConversation?: boolean;
  thinkingProcess?: string;
  error?: string;
}
