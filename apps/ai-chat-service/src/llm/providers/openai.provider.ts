import { LLMProviderType } from '@req2task/dto';
import { LLMConfig } from '../../database/entities/llm-config.entity.js';
import { BaseProvider } from './base.provider.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider extends BaseProvider {
  readonly providerType = LLMProviderType.OPENAI;
  readonly displayName = 'OpenAI';

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return OPENAI_BASE_URL;
  }
}
