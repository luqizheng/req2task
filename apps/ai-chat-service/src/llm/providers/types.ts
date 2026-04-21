import { LLMProviderType } from '@req2task/dto';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMResponse {
  content: string;
  usage?: LLMUsage;
  finishReason?: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
  model?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: LLMUsage;
  finishReason?: string;
}

export interface IProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName: string;
  timeout?: number;
  maxRetries?: number;
}

export interface LLMProvider {
  readonly providerType: LLMProviderType;
  readonly displayName: string;
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateStream(messages: LLMMessage[], options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>>;
  isAvailable(): Promise<boolean>;
}
