import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  LLMConfig,
  LLMProviderType,
} from '@req2task/core';

describe('AiService', () => {
  let service: AiService;
  let llmConfigRepository: jest.Mocked<Repository<LLMConfig>>;
  let llmService: jest.Mocked<LLMService>;
  let promptService: jest.Mocked<PromptService>;
  let vectorStore: jest.Mocked<ChromaVectorStore>;

  beforeEach(async () => {
    const mockLLMConfigRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockLLMService = {
      chat: jest.fn(),
      generate: jest.fn(),
      chatWithConfig: jest.fn(),
    };

    const mockPromptService = {
      getAll: jest.fn(),
      render: jest.fn(),
    };

    const mockVectorStore = {
      search: jest.fn(),
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: getRepositoryToken(LLMConfig),
          useValue: mockLLMConfigRepository,
        },
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
        {
          provide: PromptService,
          useValue: mockPromptService,
        },
        {
          provide: ChromaVectorStore,
          useValue: mockVectorStore,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    llmConfigRepository = module.get(getRepositoryToken(LLMConfig));
    llmService = module.get(LLMService);
    promptService = module.get(PromptService);
    vectorStore = module.get(ChromaVectorStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLLMConfig', () => {
    it('should create a new LLM config', async () => {
      const createDto = {
        name: 'Test Config',
        provider: LLMProviderType.DEEPSEEK,
        apiKey: 'test-key',
        modelName: 'deepseek-chat',
      };

      const mockConfig = {
        id: '1',
        ...createDto,
        isDefault: false,
        isActive: true,
      } as LLMConfig;

      llmConfigRepository.create.mockReturnValue(mockConfig);
      llmConfigRepository.save.mockResolvedValue(mockConfig);

      const result = await service.createLLMConfig(createDto);

      expect(result.name).toBe('Test Config');
      expect(llmConfigRepository.create).toHaveBeenCalled();
      expect(llmConfigRepository.save).toHaveBeenCalled();
    });

    it('should reset default flag if new config is default', async () => {
      const createDto = {
        name: 'Test Config',
        provider: LLMProviderType.DEEPSEEK,
        apiKey: 'test-key',
        modelName: 'deepseek-chat',
        isDefault: true,
      };

      const mockConfig = {
        id: '1',
        ...createDto,
      } as LLMConfig;

      llmConfigRepository.create.mockReturnValue(mockConfig);
      llmConfigRepository.save.mockResolvedValue(mockConfig);

      await service.createLLMConfig(createDto);

      expect(llmConfigRepository.update).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false },
      );
    });
  });

  describe('findAllLLMConfigs', () => {
    it('should return all LLM configs', async () => {
      const mockConfigs = [
        { id: '1', name: 'Config 1' },
        { id: '2', name: 'Config 2' },
      ] as LLMConfig[];

      llmConfigRepository.find.mockResolvedValue(mockConfigs);

      const result = await service.findAllLLMConfigs();

      expect(result).toHaveLength(2);
      expect(llmConfigRepository.find).toHaveBeenCalledWith({
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('chat', () => {
    it('should return chat response', async () => {
      const request = { message: 'Hello' };

      llmService.chat.mockResolvedValue({ content: 'Hi there!', configId: 'default' });

      const result = await service.chat(request);

      expect(result.content).toBe('Hi there!');
      expect(llmService.chat).toHaveBeenCalled();
    });
  });

  describe('generateRequirement', () => {
    it('should generate requirement', async () => {
      const input = 'Build a login feature';

      promptService.render.mockReturnValue({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Generated template',
        temperature: 0.7,
        maxTokens: 2000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: 'Generated requirement content',
        configId: 'default',
      });

      const result = await service.generateRequirement(input);

      expect(result.content).toBe('Generated requirement content');
      expect(promptService.render).toHaveBeenCalledWith(
        'REQUIREMENT_GENERATION',
        { rawRequirement: input, conversation: '' },
      );
    });
  });

  describe('searchVectorStore', () => {
    it('should search vector store', async () => {
      const mockResults = [
        { id: '1', content: 'Doc 1', score: 0.9 },
        { id: '2', content: 'Doc 2', score: 0.8 },
      ];

      vectorStore.search.mockResolvedValue(mockResults);

      const result = await service.searchVectorStore('test query', 5);

      expect(result).toHaveLength(2);
      expect(vectorStore.search).toHaveBeenCalledWith('test query', 5);
    });
  });

  describe('addToVectorStore', () => {
    it('should add documents to vector store', async () => {
      const documents = [
        { id: '1', content: 'Doc 1' },
        { id: '2', content: 'Doc 2' },
      ];

      await service.addToVectorStore(documents);

      expect(vectorStore.add).toHaveBeenCalledWith(documents);
    });
  });

  describe('getPromptTemplates', () => {
    it('should return all prompt templates', async () => {
      const mockTemplates = [
        {
          code: 'T1',
          name: 'Template 1',
          category: 'requirement-generation' as const,
          description: 'Test',
          systemPrompt: 'System',
          userPromptTemplate: 'User',
          parameters: [],
        },
        {
          code: 'T2',
          name: 'Template 2',
          category: 'task-breakdown' as const,
          description: 'Test',
          systemPrompt: 'System',
          userPromptTemplate: 'User',
          parameters: [],
        },
      ];

      promptService.getAll.mockReturnValue(mockTemplates as any);

      const result = await service.getPromptTemplates();

      expect(result).toHaveLength(2);
      expect(promptService.getAll).toHaveBeenCalled();
    });
  });
});
