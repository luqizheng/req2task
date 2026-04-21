import { DataSource, Repository } from 'typeorm';
import { LlMConfigService } from './llm-config.service.js';
import { LLMConfig } from '../database/entities/llm-config.entity.js';

jest.mock('../database/entities/llm-config.entity.js');

describe('LlMConfigService', () => {
  let service: LlMConfigService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<LLMConfig>>;

  const mockConfig: LLMConfig = {
    id: 'config-1',
    name: 'Test Config',
    provider: 'deepseek' as const,
    apiKey: 'encrypted-key',
    baseUrl: null,
    modelName: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<LLMConfig>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    service = new LlMConfigService(mockDataSource);

    process.env.LLM_CONFIG_ENCRYPTION_KEY = 'test-encryption-key-for-testing';
  });

  afterEach(() => {
    delete process.env.LLM_CONFIG_ENCRYPTION_KEY;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new config', async () => {
      const createDto = {
        name: 'New Config',
        provider: 'deepseek' as const,
        modelName: 'deepseek-chat',
        apiKey: 'test-api-key',
      };

      mockRepository.create.mockReturnValue(mockConfig);
      mockRepository.save.mockResolvedValue(mockConfig);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.apiKey).toBe('[ENCRYPTED]');
    });

    it('should clear default flag when creating new default config', async () => {
      const createDto = {
        name: 'New Default Config',
        provider: 'openai' as const,
        modelName: 'gpt-4',
        isDefault: true,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.create.mockReturnValue({ ...mockConfig, isDefault: true });
      mockRepository.save.mockResolvedValue({ ...mockConfig, isDefault: true });

      await service.create(createDto);

      expect(mockRepository.update).toHaveBeenCalledWith({ isDefault: true }, { isDefault: false });
    });
  });

  describe('findAll', () => {
    it('should return list of configs', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockConfig], 1]);

      const result = await service.findAll();

      expect(result.configs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.configs[0].apiKey).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('should return config by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockConfig);

      const result = await service.findOne('config-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('config-1');
    });

    it('should return null when config not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing config', async () => {
      const updateDto = { name: 'Updated Name' };
      mockRepository.findOneBy.mockResolvedValue(mockConfig);
      mockRepository.save.mockResolvedValue({ ...mockConfig, name: 'Updated Name' });

      const result = await service.update('config-1', updateDto);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null when config not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete config', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.remove('config-1');

      expect(result).toBe(true);
    });

    it('should return false when config not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      const result = await service.remove('nonexistent');

      expect(result).toBe(false);
    });
  });
});
