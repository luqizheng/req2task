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

export interface LLMProvider {
  generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}
