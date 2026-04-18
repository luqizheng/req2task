import { LLMConfig } from '../entities/llm-config.entity';
import { BaseLLMProvider } from './base-llm-provider';
import { LLMProviderType } from '@req2task/dto';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaProvider extends BaseLLMProvider {
  readonly providerType = LLMProviderType.OLLAMA;

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return OLLAMA_BASE_URL;
  }
}
