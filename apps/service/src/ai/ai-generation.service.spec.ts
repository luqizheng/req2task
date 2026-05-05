import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { PromptService } from '@req2task/core';
import { LLmClientService } from './llm-client.service';
import { RawRequirementService } from '../raw-requirement/raw-requirement.service';
import { AiPersistenceService } from './ai-persistence.service';
import { RequirementVectorService } from './requirement-vector.service';
import { Requirement, UserStory, AcceptanceCriteria } from '@req2task/core';

describe('AiGenerationService', () => {
  let service: AiGenerationService;
  let mockRequirementRepository: any;
  let mockUserStoryRepository: any;
  let mockAcceptanceCriteriaRepository: any;
  let mockPromptService: any;
  let mockLlmClient: any;
  let mockRawRequirementService: any;
  let mockPersistenceService: any;
  let mockVectorService: any;

  const mockRequirement = {
    id: 'req-uuid',
    entityKey: 'REQ-001',
    title: '用户登录功能',
    description: '实现用户登录功能，支持用户名密码登录',
    content: '',
    keyElements: [] as string[],
    priority: 'HIGH',
    source: 'MANUAL',
    status: 'DRAFT',
    storyPoints: 5,
    sourceRawRequirementId: 'raw-uuid',
    projectId: 'proj-uuid',
    createdById: 'user-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    modules: [],
    userStories: [],
  } as unknown as Requirement;

  beforeEach(async () => {
    mockRequirementRepository = {
      findOne: jest.fn(),
    };
    mockUserStoryRepository = {
      findOne: jest.fn(),
    };
    mockAcceptanceCriteriaRepository = {
      findOne: jest.fn(),
    };
    mockPromptService = {
      render: jest.fn().mockReturnValue({
        systemPrompt: 'system prompt',
        userPrompt: 'user prompt',
        temperature: 0.5,
        maxTokens: 2000,
      }),
    };
    mockLlmClient = {
      generate: jest.fn(),
    };
    mockRawRequirementService = {};
    mockPersistenceService = {
      persistUserStories: jest.fn().mockResolvedValue([]),
    };
    mockVectorService = {
      searchSimilarRequirements: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGenerationService,
        { provide: getRepositoryToken(Requirement), useValue: mockRequirementRepository },
        { provide: getRepositoryToken(UserStory), useValue: mockUserStoryRepository },
        { provide: getRepositoryToken(AcceptanceCriteria), useValue: mockAcceptanceCriteriaRepository },
        { provide: PromptService, useValue: mockPromptService },
        { provide: LLmClientService, useValue: mockLlmClient },
        { provide: RawRequirementService, useValue: mockRawRequirementService },
        { provide: AiPersistenceService, useValue: mockPersistenceService },
        { provide: RequirementVectorService, useValue: mockVectorService },
      ],
    }).compile();

    service = module.get<AiGenerationService>(AiGenerationService);
  });

  describe('generateFeaturePoints', () => {
    it('should generate feature points for a requirement', async () => {
      const expectedFeaturePoints = `[用户认证] 用户登录功能
[用户认证] 用户登出功能
[用户管理] 修改密码`;

      mockRequirementRepository.findOne.mockResolvedValue(mockRequirement);
      mockLlmClient.generate.mockResolvedValue({
        content: expectedFeaturePoints,
      });

      const result = await service.generateFeaturePoints('req-uuid');

      expect(result.featurePoints).toBe(expectedFeaturePoints);
      expect(result.rawContent).toBe(expectedFeaturePoints);
      expect(mockPromptService.render).toHaveBeenCalledWith(
        'FEATURE_POINT_GENERATION',
        expect.objectContaining({
          requirementTitle: mockRequirement.title,
          requirementDescription: mockRequirement.description,
        }),
      );
    });

    it('should throw BadRequestException when requirement not found', async () => {
      mockRequirementRepository.findOne.mockResolvedValue(null);

      await expect(service.generateFeaturePoints('non-existent-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include context when provided', async () => {
      const context = '项目是一个电商平台';
      mockRequirementRepository.findOne.mockResolvedValue(mockRequirement);
      mockLlmClient.generate.mockResolvedValue({
        content: 'feature points',
      });

      await service.generateFeaturePoints('req-uuid', context);

      expect(mockPromptService.render).toHaveBeenCalledWith(
        'FEATURE_POINT_GENERATION',
        expect.objectContaining({
          context,
        }),
      );
    });
  });
});
