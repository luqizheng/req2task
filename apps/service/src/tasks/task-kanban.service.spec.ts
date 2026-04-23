import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TaskKanbanService } from './task-kanban.service';
import { Task, Requirement } from '@req2task/core';
import { TaskStatus } from '@req2task/dto';

describe('TaskKanbanService', () => {
  let service: TaskKanbanService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let requirementRepository: jest.Mocked<Repository<Requirement>>;

  beforeEach(async () => {
    const mockTaskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockRequirementRepository = {
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskKanbanService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Requirement),
          useValue: mockRequirementRepository,
        },
      ],
    }).compile();

    service = module.get<TaskKanbanService>(TaskKanbanService);
    taskRepository = module.get(getRepositoryToken(Task));
    requirementRepository = module.get(getRepositoryToken(Requirement));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canTransition', () => {
    it('should allow transition from TODO to IN_PROGRESS', async () => {
      const canTransition = await service.canTransition(
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
      );
      expect(canTransition).toBe(true);
    });

    it('should allow transition from TODO to BLOCKED', async () => {
      const canTransition = await service.canTransition(
        TaskStatus.TODO,
        TaskStatus.BLOCKED,
      );
      expect(canTransition).toBe(true);
    });

    it('should not allow transition from TODO to DONE', async () => {
      const canTransition = await service.canTransition(
        TaskStatus.TODO,
        TaskStatus.DONE,
      );
      expect(canTransition).toBe(false);
    });

    it('should allow same status transition', async () => {
      const canTransition = await service.canTransition(
        TaskStatus.TODO,
        TaskStatus.TODO,
      );
      expect(canTransition).toBe(true);
    });
  });

  describe('transitionStatus', () => {
    it('should transition status successfully', async () => {
      const task = {
        id: '1',
        status: TaskStatus.TODO,
        requirementId: 'req-1',
      } as Task;

      taskRepository.findOne.mockResolvedValue(task);
      taskRepository.save.mockResolvedValue({
        ...task,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.transitionStatus('1', TaskStatus.IN_PROGRESS);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should throw error if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.transitionStatus('nonexistent', TaskStatus.IN_PROGRESS),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if transition not allowed', async () => {
      const task = {
        id: '1',
        status: TaskStatus.TODO,
        requirementId: 'req-1',
      } as Task;

      taskRepository.findOne.mockResolvedValue(task);

      await expect(
        service.transitionStatus('1', TaskStatus.DONE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for TODO', async () => {
      const transitions = await service.getAllowedTransitions(TaskStatus.TODO);
      expect(transitions).toContain(TaskStatus.IN_PROGRESS);
      expect(transitions).toContain(TaskStatus.BLOCKED);
    });

    it('should return empty array for DONE', async () => {
      const transitions = await service.getAllowedTransitions(TaskStatus.DONE);
      expect(transitions).toEqual([TaskStatus.IN_PROGRESS]);
    });
  });

  describe('getKanbanBoard', () => {
    it('should return kanban board grouped by status', async () => {
      const mockTasks = [
        { id: '1', status: TaskStatus.TODO, assignedTo: null, createdBy: null } as Task,
        { id: '2', status: TaskStatus.IN_PROGRESS, assignedTo: null, createdBy: null } as Task,
        { id: '3', status: TaskStatus.TODO, assignedTo: null, createdBy: null } as Task,
      ];

      taskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getKanbanBoard('req-1');

      expect(result[TaskStatus.TODO]).toHaveLength(2);
      expect(result[TaskStatus.IN_PROGRESS]).toHaveLength(1);
      expect(result[TaskStatus.DONE]).toHaveLength(0);
    });
  });

  describe('getTaskStatistics', () => {
    it('should return task statistics', async () => {
      const mockTasks = [
        {
          id: '1',
          status: TaskStatus.DONE,
          priority: 'high',
          estimatedHours: 8,
          actualHours: 6,
        } as Task,
        {
          id: '2',
          status: TaskStatus.IN_PROGRESS,
          priority: 'medium',
          estimatedHours: 4,
          actualHours: null,
        } as Task,
      ];

      taskRepository.find.mockResolvedValue(mockTasks);

      const result = await service.getTaskStatistics('req-1');

      expect(result.total).toBe(2);
      expect(result.byStatus[TaskStatus.DONE]).toBe(1);
      expect(result.byStatus[TaskStatus.IN_PROGRESS]).toBe(1);
      expect(result.completedPercentage).toBe(50);
      expect(result.estimatedHours).toBe(12);
      expect(result.actualHours).toBe(6);
    });

    it('should return 0% completion for empty requirement', async () => {
      taskRepository.find.mockResolvedValue([]);

      const result = await service.getTaskStatistics('req-1');

      expect(result.total).toBe(0);
      expect(result.completedPercentage).toBe(0);
    });
  });
});
