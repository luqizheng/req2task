import type { AIChatMessage } from './message';

export interface AIChatEvents {
  'message-sent': (message: AIChatMessage) => void;
  'message-received': (message: AIChatMessage) => void;
  'done': (message: AIChatMessage, conversationId: string) => void;
  'stream-start': () => void;
  'stream-end': () => void;
  'error': (error: Error) => void;
  'conversation-created': (conversationId: string) => void;
}

export type AIChatEventName = keyof AIChatEvents;
