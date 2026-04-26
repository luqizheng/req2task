import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UserStoriesService } from './user-stories.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { UserStory, AcceptanceCriteria } from '@req2task/core';
import { CriteriaType } from '@req2task/dto';

interface MockRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
}

describe('UserStoriesService', () => {
  let service: UserStoriesService;
  let userStoryRepository: MockRepository;
  let acceptanceCriteriaService: { toResponseDto: jest.Mock };

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
    userStoryRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
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
        UserStoriesService,
        {
          provide: AcceptanceCriteriaService,
          useValue: acceptanceCriteriaService,
        },
        {
          provide: getRepositoryToken(UserStory),
          useValue: userStoryRepository,
        },
        {
          provide: getRepositoryToken(AcceptanceCriteria),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserStoriesService>(UserStoriesService);
  });

  describe('create', () => {
    it('should create a new user story', async () => {
      userStoryRepository.create.mockReturnValue(mockUserStory);
      userStoryRepository.save.mockResolvedValue(mockUserStory);

      const result = await service.create('req-uuid', {
        role: 'developer',
        goal: '登录系统',
        benefit: '快速访问功能',
      });

      expect(result.role).toBe('developer');
      expect(userStoryRepository.create).toHaveBeenCalled();
      expect(userStoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('findByRequirement', () => {
    it('should return user stories for requirement', async () => {
      userStoryRepository.find.mockResolvedValue([mockUserStory]);

      const result = await service.findByRequirement('req-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('developer');
    });
  });

  describe('update', () => {
    it('should update user story', async () => {
      const updated = { ...mockUserStory, role: 'admin' };
      userStoryRepository.findOne.mockResolvedValue(mockUserStory);
      userStoryRepository.save.mockResolvedValue(updated);

      const result = await service.update('us-uuid', { role: 'admin' });

      expect(result.role).toBe('admin');
    });

    it('should throw NotFoundException when not found', async () => {
      userStoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { role: 'dev' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete user story', async () => {
      userStoryRepository.findOne.mockResolvedValue(mockUserStory);
      userStoryRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('us-uuid')).resolves.not.toThrow();
    });
  });
});
