import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictDetectionService } from './conflict-detection.service';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  RawRequirement,
  SearchResult,
} from '@req2task/core';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;
  let rawRequirementRepository: jest.Mocked<Repository<RawRequirement>>;
  let llmService: jest.Mocked<LLMService>;
  let promptService: jest.Mocked<PromptService>;
  let vectorStore: jest.Mocked<ChromaVectorStore>;

  beforeEach(async () => {
    const mockRawRequirementRepository = {
      findOne: jest.fn(),
    };

    const mockLLMService = {
      generate: jest.fn(),
    };

    const mockPromptService = {
      renderTemplate: jest.fn(),
    };

    const mockVectorStore = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConflictDetectionService,
        {
          provide: getRepositoryToken(RawRequirement),
          useValue: mockRawRequirementRepository,
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

    service = module.get<ConflictDetectionService>(ConflictDetectionService);
    rawRequirementRepository = module.get(getRepositoryToken(RawRequirement));
    llmService = module.get(LLMService);
    promptService = module.get(PromptService);
    vectorStore = module.get(ChromaVectorStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectConflicts', () => {
    it('should detect no conflicts when requirement not found', async () => {
      rawRequirementRepository.findOne.mockResolvedValue(null);

      const result = await service.detectConflicts('nonexistent');

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect no conflicts when no related requirements found', async () => {
      const mockRequirement = {
        id: '1',
        originalContent: 'Build a login feature',
      } as RawRequirement;

      rawRequirementRepository.findOne.mockResolvedValue(mockRequirement);
      vectorStore.search.mockResolvedValue([]);

      const result = await service.detectConflicts('1');

      expect(result.hasConflict).toBe(false);
      expect(result.relatedRequirements).toHaveLength(0);
    });

    it('should detect conflicts when related requirements found', async () => {
      const mockRequirement = {
        id: '1',
        originalContent: 'Build a login feature',
      } as RawRequirement;

      const mockRelated: SearchResult[] = [
        { id: '2', content: 'Build a registration feature', score: 0.8 },
      ];

      rawRequirementRepository.findOne.mockResolvedValue(mockRequirement);
      vectorStore.search.mockResolvedValue(mockRelated);
      promptService.renderTemplate.mockReturnValue('Conflict template');
      llmService.generate.mockResolvedValue({
        content: `Type: functional
Description: Login and registration have overlapping user fields
Suggestion: Consolidate user data collection`,
        configId: 'default',
      });

      const result = await service.detectConflicts('1');

      expect(result.hasConflict).toBe(true);
      expect(result.relatedRequirements).toHaveLength(1);
    });
  });

  describe('semanticSearch', () => {
    it('should search vector store', async () => {
      const mockResults: SearchResult[] = [
        { id: '1', content: 'Result 1', score: 0.9 },
        { id: '2', content: 'Result 2', score: 0.8 },
      ];

      vectorStore.search.mockResolvedValue(mockResults);

      const result = await service.semanticSearch('test query', 5);

      expect(result).toHaveLength(2);
      expect(vectorStore.search).toHaveBeenCalledWith('test query', 5);
    });

    it('should use default limit when not provided', async () => {
      vectorStore.search.mockResolvedValue([]);

      await service.semanticSearch('test query');

      expect(vectorStore.search).toHaveBeenCalledWith('test query', 10);
    });
  });

  describe('chat', () => {
    it('should generate chat response without context', async () => {
      llmService.generate.mockResolvedValue({
        content: 'This is a response',
        configId: 'default',
      });

      const result = await service.chat([
        { role: 'user', content: 'Hello' },
      ]);

      expect(result.content).toBe('This is a response');
      expect(result.context).toBeUndefined();
    });

    it('should generate chat response with context', async () => {
      const mockRequirement = {
        id: '1',
        originalContent: 'Build a login feature',
      } as RawRequirement;

      rawRequirementRepository.findOne.mockResolvedValue(mockRequirement);
      vectorStore.search.mockResolvedValue([
        { id: '2', content: 'Related feature', score: 0.8 },
      ]);
      llmService.generate.mockResolvedValue({
        content: 'Context-aware response',
        configId: 'default',
      });

      const result = await service.chat(
        [{ role: 'user', content: 'Hello' }],
        '1',
      );

      expect(result.content).toBe('Context-aware response');
      expect(result.context).toBeDefined();
    });
  });
});
