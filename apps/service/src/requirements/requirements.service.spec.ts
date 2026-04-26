import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { UserStoriesService } from './user-stories.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import {
  Requirement,
  User,
  FeatureModule,
} from '@req2task/core';
import {
  RequirementStatus,
  Priority,
  RequirementSource,
  UserRole,
} from '@req2task/dto';

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
  let featureModuleRepository: MockRepository;
  let userStoriesService: {
    findByRequirement: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let acceptanceCriteriaService: {
    toResponseDto: jest.Mock;
  };

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

  beforeEach(async () => {
    requirementRepository = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    featureModuleRepository = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userStoriesService = {
      findByRequirement: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    acceptanceCriteriaService = {
      toResponseDto: jest.fn((criteria) => ({
        id: criteria.id,
        userStoryId: criteria.userStoryId,
        criteriaType: criteria.criteriaType,
        content: criteria.content,
        testMethod: criteria.testMethod,
        createdAt: criteria.createdAt,
        updatedAt: criteria.updatedAt,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: UserStoriesService,
          useValue: userStoriesService,
        },
        {
          provide: AcceptanceCriteriaService,
          useValue: acceptanceCriteriaService,
        },
        {
          provide: getRepositoryToken(Requirement),
          useValue: requirementRepository,
        },
        {
          provide: getRepositoryToken(FeatureModule),
          useValue: featureModuleRepository,
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
});
