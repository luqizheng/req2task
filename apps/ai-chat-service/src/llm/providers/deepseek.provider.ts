import { LLMProviderType } from '@req2task/dto';
import { LLMConfig } from '../../database/entities/llm-config.entity.js';
import { BaseProvider } from './base.provider.js';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export class DeepSeekProvider extends BaseProvider {
  readonly providerType = LLMProviderType.DEEPSEEK;
  readonly displayName = 'DeepSeek';

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return DEEPSEEK_BASE_URL;
  }
}
