import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { AcceptanceCriteria } from '@req2task/core';
import { CriteriaType } from '@req2task/dto';

interface MockRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
}

describe('AcceptanceCriteriaService', () => {
  let service: AcceptanceCriteriaService;
  let acceptanceCriteriaRepository: MockRepository;

  const mockAcceptanceCriteria: AcceptanceCriteria = {
    id: 'ac-uuid',
    userStoryId: 'us-uuid',
    criteriaType: CriteriaType.FUNCTIONAL,
    content: 'Given...When...Then...',
    testMethod: '自动化测试',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as AcceptanceCriteria;

  beforeEach(async () => {
    acceptanceCriteriaRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptanceCriteriaService,
        {
          provide: getRepositoryToken(AcceptanceCriteria),
          useValue: acceptanceCriteriaRepository,
        },
      ],
    }).compile();

    service = module.get<AcceptanceCriteriaService>(AcceptanceCriteriaService);
  });

  describe('create', () => {
    it('should create acceptance criteria for user story', async () => {
      acceptanceCriteriaRepository.create.mockReturnValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.save.mockResolvedValue(mockAcceptanceCriteria);

      const result = await service.create('us-uuid', {
        criteriaType: CriteriaType.FUNCTIONAL,
        content: 'Given...When...Then...',
      });

      expect(result.content).toBe('Given...When...Then...');
    });
  });

  describe('findByUserStory', () => {
    it('should return acceptance criteria for user story', async () => {
      acceptanceCriteriaRepository.find.mockResolvedValue([mockAcceptanceCriteria]);

      const result = await service.findByUserStory('us-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Given...When...Then...');
    });
  });

  describe('update', () => {
    it('should update acceptance criteria', async () => {
      const updated = { ...mockAcceptanceCriteria, content: 'Updated' };
      acceptanceCriteriaRepository.findOne.mockResolvedValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.save.mockResolvedValue(updated);

      const result = await service.update('ac-uuid', {
        content: 'Updated',
      });

      expect(result.content).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      acceptanceCriteriaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete acceptance criteria', async () => {
      acceptanceCriteriaRepository.findOne.mockResolvedValue(mockAcceptanceCriteria);
      acceptanceCriteriaRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('ac-uuid')).resolves.not.toThrow();
    });
  });
});
