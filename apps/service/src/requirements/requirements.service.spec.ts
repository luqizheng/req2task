import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { EntityKeyService } from '../common/services/entity-key.service';
import { Requirement, User, FeatureModule } from '@req2task/core';
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
  findBy: jest.Mock;
  createQueryBuilder: jest.Mock;
}

describe('RequirementsService', () => {
  let service: RequirementsService;
  let requirementRepository: MockRepository;
  let featureModuleRepository: MockRepository;
  let acceptanceCriteriaService: { toResponseDto: jest.Mock };
  let entityKeyService: { generateEntityKey: jest.Mock };

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
    entityKey: 'REQ-001',
    modules: [],
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
    keyElements: null,
    parent: null,
    sourceRawRequirementId: null,
    sourceRawRequirement: null,
    conversationId: null,
    reviewChainId: null,
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
      findBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    featureModuleRepository = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findBy: jest.fn().mockResolvedValue([{ id: 'module-uuid', projectId: 'project-uuid', name: 'Test Module' }]),
      createQueryBuilder: jest.fn(),
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

    entityKeyService = {
      generateEntityKey: jest.fn().mockResolvedValue(['REQ-001']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: AcceptanceCriteriaService,
          useValue: acceptanceCriteriaService,
        },
        {
          provide: EntityKeyService,
          useValue: entityKeyService,
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

  describe('save', () => {
    it('should create a new requirement', async () => {
      requirementRepository.create.mockReturnValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(mockRequirement);
      requirementRepository.findOne.mockResolvedValue(mockRequirement);

      const result = await service.save({ title: 'Test Requirement', moduleIds: ['module-uuid'] }, 'user-uuid');

      expect(result.title).toBe('Test Requirement');
      expect(requirementRepository.create).toHaveBeenCalled();
      expect(requirementRepository.save).toHaveBeenCalled();
    });

    it('should set default values', async () => {
      requirementRepository.create.mockReturnValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(mockRequirement);
      requirementRepository.findOne.mockResolvedValue(mockRequirement);

      await service.save({ title: 'Test', moduleIds: ['module-uuid'] }, 'user-uuid');

      expect(requirementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RequirementStatus.DRAFT,
          priority: Priority.MEDIUM,
          source: RequirementSource.MANUAL,
        }),
      );
    });

    it('should update existing requirement', async () => {
      const updated = { ...mockRequirement, title: 'Updated Title' };
      requirementRepository.findOne.mockResolvedValue(mockRequirement);
      requirementRepository.save.mockResolvedValue(updated);

      const result = await service.save({ id: 'req-uuid', title: 'Updated Title' }, 'user-uuid');

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('findByModule', () => {
    it('should return paginated requirements', async () => {
      requirementRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockRequirement], 1]),
      });

      const result = await service.findByModule('module-uuid', 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
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
