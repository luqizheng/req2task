import { LLMProviderType } from '@req2task/dto';
import type { LLMProvider } from './providers/types.js';
import { LLMConfig } from '../database/entities/llm-config.entity.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { DeepSeekProvider } from './providers/deepseek.provider.js';
import { OllamaProvider } from './providers/ollama.provider.js';

export class LLMProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case LLMProviderType.OPENAI:
        return new OpenAIProvider(config);
      case LLMProviderType.DEEPSEEK:
        return new DeepSeekProvider(config);
      case LLMProviderType.OLLAMA:
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported LLM provider type: ${config.provider}`);
    }
  }

  static getAvailableProviders(): Array<{ type: LLMProviderType; name: string }> {
    return [
      { type: LLMProviderType.OPENAI, name: 'OpenAI' },
      { type: LLMProviderType.DEEPSEEK, name: 'DeepSeek' },
      { type: LLMProviderType.OLLAMA, name: 'Ollama' },
    ];
  }
}
