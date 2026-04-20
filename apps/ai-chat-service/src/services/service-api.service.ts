import { config } from '../config/index.js';
import type { LLMConfigResponseDto, LLMConfigListResponseDto } from '@req2task/dto';
import { logger } from '../utils/logger.js';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export class ServiceApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.serviceApiUrl;
  }

  async getDefaultLLMConfig(): Promise<LLMConfigResponseDto | null> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/llm-configs`);
      const result = await response.json() as ApiResponse<LLMConfigListResponseDto>;
      
      if (result.code !== 0 || !result.data?.configs) {
        logger.error({ response: result }, 'Failed to fetch LLM configs');
        return null;
      }

      const defaultConfig = result.data.configs.find(c => c.isDefault && c.isActive);
      return defaultConfig || null;
    } catch (error) {
      logger.error({ error }, 'Error fetching default LLM config');
      return null;
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
}
