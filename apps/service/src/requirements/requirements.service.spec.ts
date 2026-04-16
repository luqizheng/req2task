import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import {
  Requirement,
  RequirementStatus,
  Priority,
  RequirementSource,
  UserStory,
  AcceptanceCriteria,
  CriteriaType,
  User,
  UserRole,
} from '@req2task/core';

interface MockRepository {
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  find: jest.Mock;
}

describe('RequirementsService', () => {
  let service: RequirementsService;
  let requirementRepository: MockRepository;
  let userStoryRepository: MockRepository;
  let acceptanceCriteriaRepository: MockRepository;

  const mockUser: User = {
    id: 'user-uuid',
    username: 'testuser',
    email: 'test@test.com',
    displayName: 'Test User',
    role: UserRole.USER,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequirement: Requirement = {
    id: 'req-uuid',
    moduleId: 'module-uuid',
    title: 'Test Requirement',
    description: 'Test Description',
    priority: Priority.HIGH,
    source: RequirementSource.MANUAL,
    status: RequirementStatus.DRAFT,
    storyPoints: 0,
    parentId: null,
    createdById: 'user-uuid',
    createdBy: mockUser,
    children: [],
    userStories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Requirement;

  const mockUserStory: UserStory = {
    id: 'us-uuid',
    requirementId: 'req-uuid',
    role: 'developer',
    goal: '登录系统',
    benefit: '快速访问功能',
    storyPoints: 3,
    acceptanceCriteria: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as UserStory;

  const mockAcceptanceCriteria: AcceptanceCriteria = {
    id: 'ac-uuid',
    userStoryId: 'us-uuid',
    userStory: mockUserStory,
    criteriaType: CriteriaType.FUNCTIONAL,
    content: 'Given...When...Then...',
    testMethod: '自动化测试',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    requirementRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userStoryRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    acceptanceCriteriaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: getRepositoryToken(Requirement),
          useValue: requirementRepository,
        },
        {
          provide: getRepositoryToken(UserStory),
          useValue: userStoryRepository,
        },
        {
          provide: getRepositoryToken(AcceptanceCriteria),
          useValue: acceptanceCriteriaRepository,
        },
      ],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
  });

  describe('create', () => {
    it('should create a new requirement', async () => {
      requirementRepository.create.mockReturnValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(mockRequirement);

      const result = await service.create(
        'module-uuid',
        { title: 'Test Requirement' },
        'user-uuid',
      );

      expect(result.title).toBe('Test Requirement');
      expect(requirementRepository.create).toHaveBeenCalled();
      expect(requirementRepository.save).toHaveBeenCalled();
    });

    it('should set default values', async () => {
      requirementRepository.create.mockReturnValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(mockRequirement);

      await service.create('module-uuid', { title: 'Test' }, 'user-uuid');

      expect(requirementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleId: 'module-uuid',
          status: RequirementStatus.DRAFT,
          priority: Priority.MEDIUM,
          source: RequirementSource.MANUAL,
        }),
      );
    });
  });

  describe('findByModule', () => {
    it('should return paginated requirements', async () => {
      requirementRepository.findAndCount.mockResolvedValue([[mockRequirement], 1]);

      const result = await service.findByModule('module-uuid', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should call findAndCount with correct params', async () => {
      requirementRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findByModule('module-uuid', 2, 10);

      expect(requirementRepository.findAndCount).toHaveBeenCalledWith({
        where: { moduleId: 'module-uuid' },
        relations: ['createdBy', 'userStories', 'children'],
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return requirement by id', async () => {
      requirementRepository.findOne.mockResolvedValue(mockRequirement);

      const result = await service.findById('req-uuid');

      expect(result.id).toBe('req-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      requirementRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update requirement', async () => {
      const updated = { ...mockRequirement, title: 'Updated Title' };
      requirementRepository.findOne.mockResolvedValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(updated);

      const result = await service.update('req-uuid', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when not found', async () => {
      requirementRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete requirement', async () => {
      requirementRepository.findOne.mockResolvedValue(mockRequirement);
      requirementRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('req-uuid')).resolves.not.toThrow();
    });

    it('should throw NotFoundException when not found', async () => {
      requirementRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUserStory', () => {
    it('should create user story for requirement', async () => {
      requirementRepository.findOne.mockResolvedValue(mockRequirement);
      userStoryRepository.create.mockReturnValue(mockUserStory);
      userStoryRepository.save.mockResolvedValue(mockUserStory);

      const result = await service.createUserStory('req-uuid', {
        role: 'developer',
        goal: '登录系统',
        benefit: '快速访问功能',
      });

      expect(result.role).toBe('developer');
    });

    it('should throw NotFoundException when requirement not found', async () => {
      requirementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createUserStory('nonexistent', {
          role: 'dev',
          goal: 'test',
          benefit: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUserStories', () => {
    it('should return user stories for requirement', async () => {
      userStoryRepository.find.mockResolvedValue([mockUserStory]);

      const result = await service.findUserStories('req-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('developer');
    });
  });

  describe('updateUserStory', () => {
    it('should update user story', async () => {
      const updated = { ...mockUserStory, role: 'admin' };
      userStoryRepository.findOne.mockResolvedValue(mockUserStory);
      userStoryRepository.save.mockResolvedValue(updated);

      const result = await service.updateUserStory('us-uuid', { role: 'admin' });

      expect(result.role).toBe('admin');
    });

    it('should throw NotFoundException when not found', async () => {
      userStoryRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUserStory('nonexistent', { role: 'dev' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUserStory', () => {
    it('should delete user story', async () => {
      userStoryRepository.findOne.mockResolvedValue(mockUserStory);
      userStoryRepository.remove.mockResolvedValue(undefined);

      await expect(service.deleteUserStory('us-uuid')).resolves.not.toThrow();
    });
  });

  describe('createAcceptanceCriteria', () => {
    it('should create acceptance criteria for user story', async () => {
      userStoryRepository.findOne.mockResolvedValue(mockUserStory);
      acceptanceCriteriaRepository.create.mockReturnValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.save.mockResolvedValue(mockAcceptanceCriteria);

      const result = await service.createAcceptanceCriteria('us-uuid', {
        criteriaType: CriteriaType.FUNCTIONAL,
        content: 'Given...When...Then...',
      });

      expect(result.content).toBe('Given...When...Then...');
    });

    it('should throw NotFoundException when user story not found', async () => {
      userStoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createAcceptanceCriteria('nonexistent', {
          criteriaType: CriteriaType.FUNCTIONAL,
          content: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAcceptanceCriteria', () => {
    it('should return acceptance criteria for user story', async () => {
      acceptanceCriteriaRepository.find.mockResolvedValue([mockAcceptanceCriteria]);

      const result = await service.findAcceptanceCriteria('us-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Given...When...Then...');
    });
  });

  describe('updateAcceptanceCriteria', () => {
    it('should update acceptance criteria', async () => {
      const updated = { ...mockAcceptanceCriteria, content: 'Updated' };
      acceptanceCriteriaRepository.findOne.mockResolvedValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.save.mockResolvedValue(updated);

      const result = await service.updateAcceptanceCriteria('ac-uuid', {
        content: 'Updated',
      });

      expect(result.content).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      acceptanceCriteriaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAcceptanceCriteria('nonexistent', { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAcceptanceCriteria', () => {
    it('should delete acceptance criteria', async () => {
      acceptanceCriteriaRepository.findOne.mockResolvedValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.remove.mockResolvedValue(undefined);

      await expect(service.deleteAcceptanceCriteria('ac-uuid')).resolves.not.toThrow();
    });
  });
});
