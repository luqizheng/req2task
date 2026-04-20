import { config } from '../config/index.js';
import type { LLMConfigResponseDto, LLMConfigListResponseDto } from '@req2task/dto';
import { LLMProviderType } from '../types.js';
import { logger } from '../utils/logger.js';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface LLMConfigListData {
  configs: LLMConfigResponseDto[];
  total: number;
}

const DEFAULT_LLM_CONFIG_FALLBACK: Partial<LLMConfigResponseDto> = {
  provider: LLMProviderType.OPENAI,
  modelName: 'gpt-4o-mini',
  maxTokens: 4000,
  temperature: 0.7,
  topP: 1,
  isActive: true,
  isDefault: false,
};

export class ServiceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.serviceApiUrl}/api`;
  }

  async getDefaultLLMConfig(): Promise<LLMConfigResponseDto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/llm-configs`);
      
      if (!response.ok) {
        logger.error({ status: response.status, url: response.url }, 'Failed to fetch LLM configs');
        return this.getDefaultConfigFallback();
      }

      const result = await response.json() as ApiResponse<LLMConfigListResponseDto | LLMConfigResponseDto[]>;
      
      if (result.code !== 0) {
        logger.error({ response: result }, 'Failed to fetch LLM configs');
        return this.getDefaultConfigFallback();
      }

      let configs: LLMConfigResponseDto[] = [];
      
      if (Array.isArray(result.data)) {
        configs = result.data;
      } else if (result.data && 'configs' in result.data) {
        configs = (result.data as LLMConfigListData).configs;
      }

      if (configs.length === 0) {
        logger.warn('No LLM configs found, using fallback');
        return this.getDefaultConfigFallback();
      }

      const defaultConfig = configs.find(c => c.isDefault && c.isActive);
      return defaultConfig || configs.find(c => c.isActive) || null;
    } catch (error) {
      logger.error({ error }, 'Error fetching default LLM config');
      return this.getDefaultConfigFallback();
    }
  }

  async getLLMConfigById(id: string): Promise<LLMConfigResponseDto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/llm-configs/${id}`);
      const result = await response.json() as ApiResponse<LLMConfigResponseDto>;
      
      if (result.code !== 0 || !result.data) {
        logger.error({ response: result }, 'Failed to fetch LLM config');
        return null;
      }

      return result.data;
    } catch (error) {
      logger.error({ error }, 'Error fetching LLM config');
      return null;
    }
  }

  private getDefaultConfigFallback(): LLMConfigResponseDto | null {
    const fallback = {
      id: 'fallback',
      name: 'Default (Fallback)',
      ...DEFAULT_LLM_CONFIG_FALLBACK,
    } as LLMConfigResponseDto;
    
    logger.info('Using fallback LLM config');
    return fallback;
  }
}
