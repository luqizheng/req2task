import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { LLMProvider, LLMMessage, LLMResponse, LLMOptions } from './llm-provider.interface';
import { LLMConfig } from '../entities/llm-config.entity';

@Injectable()
export class DeepSeekProvider implements LLMProvider {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.deepseek.com',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generate(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const response = await this.client.post('/chat/completions', {
      model: this.config.modelName,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      top_p: options?.topP,
      stop: options?.stop,
    });

    const data = response.data;
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.post('/chat/completions', {
        model: this.config.modelName,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
