import type { AIChatMessage } from './message';

export interface AIChatConfig {
  endpoint?: string;
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
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (message: AIChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}
