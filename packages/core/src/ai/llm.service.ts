import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMProviderType } from '@req2task/dto';
import { LLMProvider, LLMMessage, LLMOptions } from './llm-provider.interface';
import { DeepSeekProvider } from './deepseek.provider';
import { OpenAIProvider } from './openai.provider';

@Injectable()
export class LLMService {
  private providerCache: Map<string, LLMProvider> = new Map();

  constructor(
    @InjectRepository(LLMConfig)
    private llmConfigRepository: Repository<LLMConfig>,
  ) {}

  async getProvider(configId?: string): Promise<LLMProvider> {
    let config: LLMConfig | null;

    if (configId) {
      config = await this.llmConfigRepository.findOne({ where: { id: configId } });
    } else {
      config = await this.llmConfigRepository.findOne({
        where: { isDefault: true, isActive: true },
      });
    }

    if (!config) {
      throw new NotFoundException('No active LLM configuration found');
    }

    const cacheKey = config.id;
    if (this.providerCache.has(cacheKey)) {
      return this.providerCache.get(cacheKey)!;
    }

    const provider = this.createProvider(config);
    this.providerCache.set(cacheKey, provider);
    return provider;
  }

  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case LLMProviderType.DEEPSEEK:
        return new DeepSeekProvider(config);
      case LLMProviderType.OPENAI:
        return new OpenAIProvider(config);
      case LLMProviderType.OLLAMA:
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async generate(
    messages: LLMMessage[],
    configId?: string,
  ): Promise<{ content: string; configId: string }> {
    const provider = await this.getProvider(configId);
    const response = await provider.generate(messages);
    return {
      content: response.content,
      configId: configId || 'default',
    };
  }

  async chat(
    messages: LLMMessage[],
    configId?: string,
  ): Promise<{ content: string; configId: string }> {
    return this.generate(messages, configId);
  }

  async chatWithConfig(
    messages: LLMMessage[],
    configId?: string,
    options?: LLMOptions,
  ): Promise<{ content: string; configId: string }> {
    const provider = await this.getProvider(configId);
    const response = await provider.generate(messages, options);
    return {
      content: response.content,
      configId: configId || 'default',
    };
  }
}
