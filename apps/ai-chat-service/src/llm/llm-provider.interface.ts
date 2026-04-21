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

export interface LLMProvider {
  readonly providerType: LLMProviderType;
  readonly displayName: string;
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  generateStream(messages: LLMMessage[], options?: LLMOptions): Promise<AsyncGenerator<StreamChunk>>;
  isAvailable(): Promise<boolean>;
}

export interface IProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  modelName: string;
  timeout?: number;
  maxRetries?: number;
}

export enum LLMErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONTEXT_LENGTH_ERROR = 'CONTEXT_LENGTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: LLMErrorCode,
    public readonly statusCode?: number,
    public readonly provider?: LLMProviderType,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
