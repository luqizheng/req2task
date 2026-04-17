import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDecompositionService } from './task-decomposition.service';
import {
  LLMService,
  PromptService,
  ChromaVectorStore,
  Task,
  TaskPriority,
} from '@req2task/core';

describe('TaskDecompositionService', () => {
  let service: TaskDecompositionService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let llmService: jest.Mocked<LLMService>;
  let promptService: jest.Mocked<PromptService>;
  let vectorStore: jest.Mocked<ChromaVectorStore>;

  beforeEach(async () => {
    const mockTaskRepository = {
      findOne: jest.fn(),
    };

    const mockLLMService = {
      generate: jest.fn(),
      chatWithConfig: jest.fn(),
    };

    const mockPromptService = {
      render: jest.fn(),
    };

    const mockVectorStore = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskDecompositionService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
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

    service = module.get<TaskDecompositionService>(TaskDecompositionService);
    taskRepository = module.get(getRepositoryToken(Task));
    llmService = module.get(LLMService);
    promptService = module.get(PromptService);
    vectorStore = module.get(ChromaVectorStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('decomposeRequirement', () => {
    it('should decompose requirement into tasks', async () => {
      promptService.render.mockReturnValue({
        systemPrompt: 'System prompt',
        userPrompt: 'Template',
        temperature: 0.5,
        maxTokens: 3000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: `1. Design database schema
Hours: 4 hours
Priority: high
Description: Design the database schema for the feature

2. Implement API endpoints
Hours: 8 hours
Priority: high
Description: Implement REST API endpoints`,
        configId: 'default',
      });

      const result = await service.decomposeRequirement('Build a feature');

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.totalEstimatedHours).toBeGreaterThan(0);
    });

    it('should return empty decomposition when no tasks found', async () => {
      promptService.render.mockReturnValue({
        systemPrompt: 'System prompt',
        userPrompt: 'Template',
        temperature: 0.5,
        maxTokens: 3000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: 'No tasks generated.',
        configId: 'default',
      });

      const result = await service.decomposeRequirement('Build a feature');

      expect(result.tasks).toHaveLength(0);
      expect(result.totalEstimatedHours).toBe(0);
    });
  });

  describe('estimateWorkload', () => {
    it('should estimate workload for requirement', async () => {
      llmService.generate.mockResolvedValue({
        content: `Hours: 16
Reasoning: The feature requires database design, API development, and testing. Estimated at 16 hours.`,
        configId: 'default',
      });

      const result = await service.estimateWorkload('Build a feature');

      expect(result.estimatedHours).toBe(16);
      expect(result.reasoning).toContain('16 hours');
    });

    it('should return 0 hours when no hours found', async () => {
      llmService.generate.mockResolvedValue({
        content: 'Unable to estimate workload.',
        configId: 'default',
      });

      const result = await service.estimateWorkload('Build a feature');

      expect(result.estimatedHours).toBe(0);
    });
  });

  describe('findSimilarRequirements', () => {
    it('should find similar requirements in same module', async () => {
      vectorStore.search.mockResolvedValue([
        {
          id: '1',
          content: 'Login feature',
          score: 0.9,
          metadata: { moduleId: 'module-1', type: 'raw_requirement' },
        },
        {
          id: '2',
          content: 'Registration feature',
          score: 0.8,
          metadata: { moduleId: 'module-1', type: 'raw_requirement' },
        },
        {
          id: '3',
          content: 'Other module feature',
          score: 0.7,
          metadata: { moduleId: 'module-2', type: 'raw_requirement' },
        },
      ]);

      const result = await service.findSimilarRequirements(
        'Authentication feature',
        'module-1',
        5,
      );

      expect(result.length).toBe(2);
      expect(result[0].similarity).toBe(0.9);
    });

    it('should return empty when no similar requirements found', async () => {
      vectorStore.search.mockResolvedValue([
        {
          id: '1',
          content: 'Different module',
          score: 0.5,
          metadata: { moduleId: 'module-2', type: 'raw_requirement' },
        },
      ]);

      const result = await service.findSimilarRequirements(
        'Authentication feature',
        'module-1',
        5,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('generateSubTasks', () => {
    it('should generate subtasks for parent task', async () => {
      const mockTask = {
        id: '1',
        title: 'Parent Task',
        description: 'Build authentication',
        requirementId: 'req-1',
      } as Task;

      taskRepository.findOne.mockResolvedValue(mockTask);
      promptService.render.mockReturnValue({
        systemPrompt: 'System prompt',
        userPrompt: 'Template',
        temperature: 0.5,
        maxTokens: 3000,
      });
      llmService.chatWithConfig.mockResolvedValue({
        content: `1. Subtask 1
Hours: 2 hours
Priority: medium
2. Subtask 2
Hours: 4 hours
Priority: high`,
        configId: 'default',
      });

      const result = await service.generateSubTasks('1');

      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.totalEstimatedHours).toBeGreaterThan(0);
    });

    it('should throw error when parent task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.generateSubTasks('nonexistent')).rejects.toThrow(
        'Parent task not found',
      );
    });
  });
});
