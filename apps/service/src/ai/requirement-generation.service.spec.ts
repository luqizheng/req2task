import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import {
  RequirementGenerationService,
  GenerateRequirementResult,
} from './requirement-generation.service';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  RawRequirement,
} from '@req2task/core';
import { RawRequirementStatus } from '@req2task/dto';

describe('RequirementGenerationService', () => {
  let service: RequirementGenerationService;
  let rawRequirementRepository: jest.Mocked<Repository<RawRequirement>>;
  let llmService: jest.Mocked<LLMService>;
  let promptService: jest.Mocked<PromptService>;
  let vectorStore: jest.Mocked<ChromaVectorStore>;

  beforeEach(async () => {
    const mockRawRequirementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockLLMService = {
      generate: jest.fn(),
      chatWithConfig: jest.fn(),
    };

    const mockPromptService = {
      render: jest.fn(),
    };

    const mockVectorStore = {
      add: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementGenerationService,
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

    service = module.get<RequirementGenerationService>(RequirementGenerationService);
    rawRequirementRepository = module.get(getRepositoryToken(RawRequirement));
    llmService = module.get(LLMService);
    promptService = module.get(PromptService);
    vectorStore = module.get(ChromaVectorStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRawRequirement', () => {
    it('should create a raw requirement', async () => {
      const mockRawRequirement = {
        id: '1',
        moduleId: 'module-1',
        originalContent: 'Build a login feature',
        status: RawRequirementStatus.PENDING,
        createdById: 'user-1',
      } as RawRequirement;

      rawRequirementRepository.create.mockReturnValue(mockRawRequirement);
      rawRequirementRepository.save.mockResolvedValue(mockRawRequirement);

      const result = await service.createRawRequirement(
        'module-1',
        'Build a login feature',
        'user-1',
      );

      expect(result.id).toBe('1');
      expect(result.originalContent).toBe('Build a login feature');
      expect(rawRequirementRepository.create).toHaveBeenCalled();
      expect(rawRequirementRepository.save).toHaveBeenCalled();
    });
  });

  describe('generateRequirement', () => {
    it('should generate requirement from raw input', async () => {
      const mockRawRequirement = {
        id: '1',
        moduleId: 'module-1',
        originalContent: 'Build a login feature',
        status: RawRequirementStatus.PENDING,
      } as RawRequirement;

      rawRequirementRepository.findOne.mockResolvedValue(mockRawRequirement);
      rawRequirementRepository.update.mockResolvedValue({ affected: 1 } as any);
      promptService.render.mockReturnValue({
        systemPrompt: 'System prompt',
        userPrompt: 'Generated template',
        temperature: 0.3,
        maxTokens: 3000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: `Title: Login Feature
Description: Implement user authentication
Priority: high
Given I am on the login page
When I enter valid credentials
Then I should be logged in
As a user, I want to login, so that I can access my account`,
        configId: 'default',
      });
      vectorStore.add.mockResolvedValue();

      const result = await service.generateRequirement('1');

      expect(result.title).toBe('Login Feature');
      expect(result.priority).toBe('high');
      expect(result.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(result.userStories.length).toBeGreaterThan(0);
    });

    it('should throw error if raw requirement not found', async () => {
      rawRequirementRepository.findOne.mockResolvedValue(null);

      await expect(service.generateRequirement('nonexistent')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generateUserStories', () => {
    it('should generate user stories', async () => {
      promptService.render.mockReturnValue({
        systemPrompt: 'System prompt',
        userPrompt: 'Template',
        temperature: 0.7,
        maxTokens: 3000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: `As a user, I want to login, so that I can access my account
As a user, I want to reset password, so that I can recover my account`,
        configId: 'default',
      });

      const result = await service.generateUserStories('Build a login feature');

      expect(result.length).toBe(2);
      expect(result[0].role).toBe('user');
      expect(result[0].goal).toBe('to login');
      expect(result[0].benefit).toBe('I can access my account');
    });
  });

  describe('generateAcceptanceCriteria', () => {
    it('should generate acceptance criteria', async () => {
      llmService.chatWithConfig.mockResolvedValue({
        content: `Given I am on the login page
When I enter valid credentials
Then I should be logged in

Given I am on the login page
When I enter invalid credentials
Then I should see an error message`,
        configId: 'default',
      });

      const result = await service.generateAcceptanceCriteria('Build a login feature');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('Given');
    });
  });

  describe('findByModule', () => {
    it('should return raw requirements for module', async () => {
      const mockRequirements = [
        { id: '1', moduleId: 'module-1', originalContent: 'Req 1' },
        { id: '2', moduleId: 'module-1', originalContent: 'Req 2' },
      ] as RawRequirement[];

      rawRequirementRepository.find.mockResolvedValue(mockRequirements);

      const result = await service.findByModule('module-1');

      expect(result).toHaveLength(2);
      expect(rawRequirementRepository.find).toHaveBeenCalledWith({
        where: { moduleId: 'module-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return raw requirement by id', async () => {
      const mockRequirement = {
        id: '1',
        moduleId: 'module-1',
        originalContent: 'Test',
      } as RawRequirement;

      rawRequirementRepository.findOne.mockResolvedValue(mockRequirement);

      const result = await service.findById('1');

      expect(result?.id).toBe('1');
    });

    it('should return null if not found', async () => {
      rawRequirementRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
