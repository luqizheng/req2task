import { LLMProviderType } from '@req2task/dto';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type StreamHandler = (chunk: StreamChunk) => void | Promise<void>;

export interface LLMProvider {
  readonly providerType: LLMProviderType;
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateStream(messages: LLMMessage[], options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>>;
  isAvailable(): Promise<boolean>;
}
