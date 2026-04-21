import type { AIChatMessage } from './message';

export interface AIChatEvents {
  'message-sent': (message: AIChatMessage) => void;
  'message-received': (message: AIChatMessage) => void;
  'done': (message: AIChatMessage) => void;
  'stream-start': () => void;
  'stream-end': () => void;
  'error': (error: Error) => void;
}

export type AIChatEventName = keyof AIChatEvents;
