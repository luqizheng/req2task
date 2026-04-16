import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectProgressService } from './project-progress.service';
import {
  Project,
  Requirement,
  Task,
  FeatureModule,
  RequirementStatus,
  TaskStatus,
} from '@req2task/core';

describe('ProjectProgressService', () => {
  let service: ProjectProgressService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let requirementRepository: jest.Mocked<Repository<Requirement>>;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let featureModuleRepository: jest.Mocked<Repository<FeatureModule>>;

  beforeEach(async () => {
    const mockProjectRepository = { findOne: jest.fn() };
    const mockRequirementRepository = { find: jest.fn() };
    const mockTaskRepository = { find: jest.fn() };
    const mockFeatureModuleRepository = { find: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectProgressService,
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(Requirement), useValue: mockRequirementRepository },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(FeatureModule), useValue: mockFeatureModuleRepository },
      ],
    }).compile();

    service = module.get<ProjectProgressService>(ProjectProgressService);
    projectRepository = module.get(getRepositoryToken(Project));
    requirementRepository = module.get(getRepositoryToken(Requirement));
    taskRepository = module.get(getRepositoryToken(Task));
    featureModuleRepository = module.get(getRepositoryToken(FeatureModule));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjectProgress', () => {
    it('should return project progress', async () => {
      const mockProject = { id: '1', name: 'Test Project' } as Project;
      const mockModules = [{ id: 'm1', projectId: '1', name: 'Module 1' }] as FeatureModule[];
      const mockRequirements = [
        { id: 'r1', moduleId: 'm1', status: RequirementStatus.COMPLETED, storyPoints: 5 },
        { id: 'r2', moduleId: 'm1', status: RequirementStatus.DRAFT, storyPoints: 3 },
      ] as Requirement[];
      const mockTasks = [
        { id: 't1', requirementId: 'r1', status: TaskStatus.DONE, estimatedHours: 4, actualHours: 5 },
        { id: 't2', requirementId: 'r2', status: TaskStatus.TODO, estimatedHours: 2, actualHours: null },
      ] as Task[];

      projectRepository.findOne.mockResolvedValue(mockProject);
      featureModuleRepository.find.mockResolvedValue(mockModules);
      requirementRepository.find.mockResolvedValue(mockRequirements);
      taskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getProjectProgress('1');

      expect(result.projectName).toBe('Test Project');
      expect(result.totalRequirements).toBe(2);
      expect(result.completedRequirements).toBe(1);
      expect(result.totalStoryPoints).toBe(8);
      expect(result.completedStoryPoints).toBe(5);
      expect(result.totalEstimatedHours).toBe(6);
      expect(result.totalActualHours).toBe(5);
    });

    it('should throw error if project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.getProjectProgress('nonexistent')).rejects.toThrow(
        'Project not found',
      );
    });
  });

  describe('getModuleProgress', () => {
    it('should return module progress', async () => {
      const mockModule = { id: 'm1', name: 'Module 1' } as FeatureModule;
      const mockRequirements = [
        { id: 'r1', status: RequirementStatus.COMPLETED },
        { id: 'r2', status: RequirementStatus.DRAFT },
      ] as Requirement[];
      const mockTasks = [
        { requirementId: 'r1', status: TaskStatus.DONE },
        { requirementId: 'r1', status: TaskStatus.IN_PROGRESS },
        { requirementId: 'r2', status: TaskStatus.TODO },
      ] as Task[];

      featureModuleRepository.findOne.mockResolvedValue(mockModule);
      requirementRepository.find.mockResolvedValue(mockRequirements);
      taskRepository.find
        .mockResolvedValueOnce([mockTasks[0], mockTasks[1]])
        .mockResolvedValueOnce([mockTasks[2]]);

      const result = await service.getModuleProgress('m1');

      expect(result.moduleName).toBe('Module 1');
      expect(result.totalRequirements).toBe(2);
      expect(result.completedRequirements).toBe(1);
      expect(result.progress).toBe(50);
    });

    it('should throw error if module not found', async () => {
      featureModuleRepository.findOne.mockResolvedValue(null);

      await expect(service.getModuleProgress('nonexistent')).rejects.toThrow(
        'Module not found',
      );
    });
  });
});
