import { LLMConfig } from '../entities/llm-config.entity';
import { BaseLLMProvider } from './base-llm-provider';
import { LLMProviderType } from '@req2task/dto';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider extends BaseLLMProvider {
  readonly providerType = LLMProviderType.OPENAI;
  readonly displayName = 'OpenAI';

  constructor(config: LLMConfig) {
    super(config);
  }

  protected getDefaultBaseUrl(): string {
    return OPENAI_BASE_URL;
  }
}
