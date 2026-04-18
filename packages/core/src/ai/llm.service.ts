import { Repository } from 'typeorm';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMProviderType } from '@req2task/dto';
import { LLMProvider, LLMMessage, LLMOptions, LLMResponse, StreamChunk } from './llm-provider.interface';
import { DeepSeekProvider } from './deepseek.provider';
import { OpenAIProvider } from './openai.provider';
import { OllamaProvider } from './ollama.provider';
import { NotFoundException, BusinessException } from '../exceptions/business.exception';

export class LLMService {
  private readonly providerCache: Map<string, LLMProvider> = new Map();

  constructor(
    private readonly llmConfigRepository: Repository<LLMConfig>,
  ) {}

  async getProvider(configId?: string): Promise<LLMProvider> {
    const config = await this.findConfig(configId);
    const cacheKey = config.id;

    if (this.providerCache.has(cacheKey)) {
      console.debug(`Using cached provider for config: ${config.name}`);
      return this.providerCache.get(cacheKey)!;
    }

    const provider = this.createProvider(config);
    this.providerCache.set(cacheKey, provider);
    console.log(`Created new provider instance for: ${config.name} (${config.provider})`);

    return provider;
  }

  private async findConfig(configId?: string): Promise<LLMConfig> {
    let config: LLMConfig | null;

    if (configId) {
      config = await this.llmConfigRepository.findOne({ where: { id: configId } });
      if (!config) {
        throw new NotFoundException(`LLM configuration not found: ${configId}`);
      }
    } else {
      config = await this.llmConfigRepository.findOne({
        where: { isDefault: true, isActive: true },
      });
      if (!config) {
        throw new NotFoundException('No default LLM configuration found');
      }
    }

    return config;
  }

  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case LLMProviderType.DEEPSEEK:
        return new DeepSeekProvider(config);
      case LLMProviderType.OPENAI:
        return new OpenAIProvider(config);
      case LLMProviderType.OLLAMA:
        return new OllamaProvider(config);
      default:
        throw new BusinessException(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  async generate(
    messages: LLMMessage[],
    configId?: string,
    options?: LLMOptions,
  ): Promise<LLMResponse> {
    const provider = await this.getProvider(configId);
    const config = await this.findConfig(configId);

    console.debug(`Generating response with ${config.name}, message count: ${messages.length}`);

    try {
      const response = await provider.generate(messages, options);
      
      if (response.usage) {
        console.log(
          `Token usage - prompt: ${response.usage.promptTokens}, ` +
          `completion: ${response.usage.completionTokens}, ` +
          `total: ${response.usage.totalTokens}`,
        );
      }

      return response;
    } catch (error) {
      console.error(`LLM generation failed: ${(error as Error).message}`);
      throw new BusinessException('LLM generation failed', 'LLM_ERROR', 500);
    }
  }

  async *generateStream(
    messages: LLMMessage[],
    configId?: string,
    options?: LLMOptions,
  ): AsyncGenerator<StreamChunk> {
    const provider = await this.getProvider(configId);
    const config = await this.findConfig(configId);

    console.debug(`Starting stream with ${config.name}, message count: ${messages.length}`);

    try {
      const streamOptions = { ...options, stream: true };
      const streamGenerator = await provider.generateStream(messages, streamOptions);

      let totalTokens = 0;
      
      for await (const chunk of streamGenerator) {
        if (chunk.usage) {
          totalTokens = chunk.usage.totalTokens;
        }
        yield chunk;
      }

      if (totalTokens > 0) {
        console.log(`Stream completed, total tokens: ${totalTokens}`);
      }
    } catch (error) {
      console.error(`LLM stream failed: ${(error as Error).message}`);
      throw new BusinessException('LLM stream failed', 'LLM_ERROR', 500);
    }
  }

  async checkProviderHealth(configId?: string): Promise<{ isAvailable: boolean; provider: string }> {
    const config = await this.findConfig(configId);
    const provider = await this.getProvider(configId);
    const isAvailable = await provider.isAvailable();

    return {
      isAvailable,
      provider: config.name,
    };
  }

  clearCache(): void {
    this.providerCache.clear();
    console.log('Provider cache cleared');
  }

  async invalidateCache(configId: string): Promise<void> {
    if (this.providerCache.has(configId)) {
      this.providerCache.delete(configId);
      console.log(`Cache invalidated for config: ${configId}`);
    }
  }

  async chat(messages: LLMMessage[], configId?: string): Promise<LLMResponse & { configId: string }> {
    const config = await this.findConfig(configId);
    const result = await this.generate(messages, configId);
    return { ...result, configId: config.id };
  }

  async chatWithConfig(
    messages: LLMMessage[],
    configId: string,
    options?: LLMOptions,
  ): Promise<LLMResponse & { configId: string }> {
    const config = await this.findConfig(configId);
    const result = await this.generate(messages, configId, options);
    return { ...result, configId: config.id };
  }
}
