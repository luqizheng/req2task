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
      const err = error as { response?: { status?: number; data?: unknown }; message?: string; code?: string };
      const status = err.response?.status;
      let errorMessage = 'LLM generation failed';
      
      if (status === 401) {
        errorMessage = 'AI API 认证失败，请检查 API Key 是否正确';
      } else if (status === 403) {
        errorMessage = 'AI API 访问被拒绝，请检查 API Key 权限';
      } else if (status === 404) {
        errorMessage = 'AI 服务不可用，请检查配置或服务是否启动';
      } else if (status === 429) {
        errorMessage = 'AI API 请求频率超限，请稍后重试';
      } else if (status && status >= 500) {
        errorMessage = 'AI 服务端错误，请稍后重试';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = '无法连接到 AI 服务，请检查网络和服务配置';
      } else if (err.message) {
        errorMessage = `AI 调用失败: ${err.message}`;
      }
      
      console.error(`LLM generation failed: ${errorMessage}`, error);
      throw new BusinessException(errorMessage, 'LLM_ERROR', 500);
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
      const err = error as { response?: { status?: number; data?: unknown }; message?: string; code?: string };
      const status = err.response?.status;
      let errorMessage = 'LLM stream failed';
      
      if (status === 401) {
        errorMessage = 'AI API 认证失败，请检查 API Key 是否正确';
      } else if (status === 403) {
        errorMessage = 'AI API 访问被拒绝，请检查 API Key 权限';
      } else if (status === 404) {
        errorMessage = 'AI 服务不可用，请检查配置或服务是否启动';
      } else if (status === 429) {
        errorMessage = 'AI API 请求频率超限，请稍后重试';
      } else if (status && status >= 500) {
        errorMessage = 'AI 服务端错误，请稍后重试';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = '无法连接到 AI 服务，请检查网络和服务配置';
      } else if (err.message) {
        errorMessage = `AI 调用失败: ${err.message}`;
      }
      
      console.error(`LLM stream failed: ${errorMessage}`, error);
      throw new BusinessException(errorMessage, 'LLM_ERROR', 500);
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
