import { BaseLLMProvider } from './base-llm-provider.js';
import { LLMProviderType } from '@req2task/dto';
import { LLMConfig } from '../database/entities/llm-config.entity.js';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export class DeepSeekProvider extends BaseLLMProvider {
  readonly providerType = LLMProviderType.DEEPSEEK;
  readonly displayName = 'DeepSeek';

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return DEEPSEEK_BASE_URL;
  }
}
