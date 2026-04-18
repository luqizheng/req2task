import { LLMService } from './llm.service';
import { LLMConfig } from '../entities/llm-config.entity';
import { LLMProviderType } from '@req2task/dto';
import { Repository } from 'typeorm';
import { NotFoundException } from '../exceptions/business.exception';

describe('LLMService', () => {
  let service: LLMService;
  let mockFindOne: jest.Mock;

  const createMockConfig = (overrides: Partial<LLMConfig> = {}): LLMConfig => ({
    id: 'config-1',
    name: 'Test Config',
    provider: LLMProviderType.OPENAI,
    apiKey: 'test-key',
    baseUrl: null,
    modelName: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    isActive: true,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as LLMConfig);

  const createMockRepository = () => {
    mockFindOne = jest.fn();
    return {
      findOne: mockFindOne,
    } as unknown as Repository<LLMConfig>;
  };

  beforeEach(() => {
    service = new LLMService(createMockRepository());
  });

  describe('getProvider', () => {
    it('should return cached provider for same config', async () => {
      const mockConfig = createMockConfig();
      mockFindOne.mockResolvedValue(mockConfig);

      const provider1 = await service.getProvider('config-1');
      const provider2 = await service.getProvider('config-1');

      expect(provider1).toBe(provider2);
    });

    it('should throw NotFoundException when config not found', async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(service.getProvider('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should create DeepSeekProvider for deepseek config', async () => {
      const mockConfig = createMockConfig({ provider: LLMProviderType.DEEPSEEK });
      mockFindOne.mockResolvedValue(mockConfig);

      const provider = await service.getProvider('config-1');

      expect(provider.providerType).toBe(LLMProviderType.DEEPSEEK);
    });

    it('should create OpenAIProvider for openai config', async () => {
      const mockConfig = createMockConfig({ provider: LLMProviderType.OPENAI });
      mockFindOne.mockResolvedValue(mockConfig);

      const provider = await service.getProvider('config-1');

      expect(provider.providerType).toBe(LLMProviderType.OPENAI);
    });

    it('should use OpenAIProvider for ollama config (API compatible)', async () => {
      const mockConfig = createMockConfig({ provider: LLMProviderType.OLLAMA });
      mockFindOne.mockResolvedValue(mockConfig);

      const provider = await service.getProvider('config-1');

      expect(provider.providerType).toBe(LLMProviderType.OLLAMA);
    });
  });

  describe('clearCache', () => {
    it('should clear provider cache', async () => {
      const mockConfig = createMockConfig();
      mockFindOne.mockResolvedValue(mockConfig);

      await service.getProvider('config-1');
      expect(() => service.clearCache()).not.toThrow();

      service.clearCache();
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for specific config', async () => {
      const mockConfig = createMockConfig();
      mockFindOne.mockResolvedValue(mockConfig);

      await service.getProvider('config-1');
      await expect(service.invalidateCache('config-1')).resolves.not.toThrow();
    });

    it('should handle invalidating non-cached config', async () => {
      await expect(service.invalidateCache('nonexistent')).resolves.not.toThrow();
    });
  });
});
