import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from '@req2task/core';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;

  beforeEach(async () => {
    const mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const mockTask = {
        id: '1',
        taskNo: 'TASK-20260416-0001',
        title: 'Test Task',
        description: 'Test Description',
        requirementId: 'req-1',
        status: TaskStatus.TODO,
        priority: 'medium',
        assignedToId: null,
        estimatedHours: null,
        actualHours: null,
        dueDate: null,
        parentTaskId: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taskRepository.create.mockReturnValue(mockTask as Task);
      taskRepository.save.mockResolvedValue(mockTask as Task);

      const result = await service.create('req-1', createDto, 'user-1');

      expect(result.title).toBe('Test Task');
      expect(result.taskNo).toContain('TASK-');
      expect(taskRepository.create).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
    });

    it('should generate unique task numbers', async () => {
      const createDto = { title: 'Test Task' };

      const mockTask = {
        id: '1',
        taskNo: 'TASK-20260416-0001',
        title: 'Test Task',
        status: TaskStatus.TODO,
      } as Task;

      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      await service.create('req-1', createDto, 'user-1');
      const result1 = await service.create('req-1', createDto, 'user-1');

      expect(result1.taskNo).toContain('TASK-');
    });
  });

  describe('findById', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        id: '1',
        taskNo: 'TASK-001',
        title: 'Test Task',
        status: TaskStatus.TODO,
        assignedTo: null,
        createdBy: null,
        dependencies: [],
      } as Task;

      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findById('1');

      expect(result.id).toBe('1');
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['assignedTo', 'createdBy', 'dependencies', 'dependents', 'requirement'],
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const mockTask = {
        id: '1',
        title: 'Old Title',
        status: TaskStatus.TODO,
        assignedTo: null,
        createdBy: null,
        dependencies: [],
      } as Task;

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        title: 'New Title',
      });

      const result = await service.update('1', { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const mockTask = { id: '1' } as Task;
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.remove.mockResolvedValue(mockTask);

      await service.delete('1');

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addDependency', () => {
    it('should add a dependency to a task', async () => {
      const mockTask = {
        id: '1',
        title: 'Task 1',
        dependencies: [],
      } as unknown as Task;

      const mockDependency = {
        id: '2',
        title: 'Task 2',
      } as unknown as Task;

      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockDependency);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
      });

      const result = await service.addDependency('1', '2');

      expect(taskRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if task depends on itself', async () => {
      const mockTask = { id: '1', dependencies: [] } as Task;
      taskRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.addDependency('1', '1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dependency already exists', async () => {
      const mockTask = {
        id: '1',
        dependencies: [{ id: '2' } as Task],
      } as Task;

      const mockDependency = { id: '2' } as Task;

      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockDependency);

      await expect(service.addDependency('1', '2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeDependency', () => {
    it('should remove a dependency from a task', async () => {
      const mockDependency = { id: '2' } as unknown as Task;
      const mockTask = {
        id: '1',
        dependencies: [mockDependency],
      } as unknown as Task;

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
      });

      const result = await service.removeDependency('1', '2');

      expect(taskRepository.save).toHaveBeenCalled();
    });
  });
});
