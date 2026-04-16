import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaselineService } from './baseline.service';
import { Baseline, Project, Requirement, Task } from '@req2task/core';

describe('BaselineService', () => {
  let service: BaselineService;
  let baselineRepository: jest.Mocked<Repository<Baseline>>;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let requirementRepository: jest.Mocked<Repository<Requirement>>;
  let taskRepository: jest.Mocked<Repository<Task>>;

  beforeEach(async () => {
    const mockBaselineRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockProjectRepository = { findOne: jest.fn() };
    const mockRequirementRepository = { find: jest.fn(), update: jest.fn() };
    const mockTaskRepository = { find: jest.fn(), update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BaselineService,
        { provide: getRepositoryToken(Baseline), useValue: mockBaselineRepository },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(Requirement), useValue: mockRequirementRepository },
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
      ],
    }).compile();

    service = module.get<BaselineService>(BaselineService);
    baselineRepository = module.get(getRepositoryToken(Baseline));
    projectRepository = module.get(getRepositoryToken(Project));
    requirementRepository = module.get(getRepositoryToken(Requirement));
    taskRepository = module.get(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBaseline', () => {
    it('should create a baseline with snapshot', async () => {
      const mockProject = { id: '1', name: 'Test Project' } as Project;
      const mockRequirements = [{ id: 'r1', title: 'Req 1', status: 'draft' }] as Requirement[];
      const mockTasks = [{ id: 't1', title: 'Task 1', status: 'todo' }] as Task[];

      const mockBaseline = {
        id: '1',
        projectId: '1',
        name: 'Baseline 1',
        snapshotData: {},
        createdById: 'user-1',
      };

      projectRepository.findOne.mockResolvedValue(mockProject);
      requirementRepository.find.mockResolvedValue(mockRequirements);
      taskRepository.find.mockResolvedValue(mockTasks);
      baselineRepository.create.mockReturnValue(mockBaseline as Baseline);
      baselineRepository.save.mockResolvedValue(mockBaseline as Baseline);

      const result = await service.createBaseline(
        '1',
        'Baseline 1',
        null,
        'user-1',
      );

      expect(result.id).toBe('1');
      expect(baselineRepository.create).toHaveBeenCalled();
      expect(baselineRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByProject', () => {
    it('should return baselines for project', async () => {
      const mockBaselines = [
        { id: '1', projectId: '1', name: 'Baseline 1' },
        { id: '2', projectId: '1', name: 'Baseline 2' },
      ] as Baseline[];

      baselineRepository.find.mockResolvedValue(mockBaselines);

      const result = await service.findByProject('1');

      expect(result).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return baseline by id', async () => {
      const mockBaseline = { id: '1', name: 'Baseline 1' } as Baseline;

      baselineRepository.findOne.mockResolvedValue(mockBaseline);

      const result = await service.findById('1');

      expect(result.id).toBe('1');
    });

    it('should throw error if not found', async () => {
      baselineRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow();
    });
  });

  describe('deleteBaseline', () => {
    it('should delete baseline', async () => {
      const mockBaseline = { id: '1' } as Baseline;

      baselineRepository.findOne.mockResolvedValue(mockBaseline);
      baselineRepository.remove.mockResolvedValue(mockBaseline);

      await service.deleteBaseline('1');

      expect(baselineRepository.remove).toHaveBeenCalled();
    });
  });
});
