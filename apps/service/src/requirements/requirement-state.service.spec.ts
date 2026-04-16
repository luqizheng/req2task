import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { RequirementStateService } from '@req2task/core';
import { Requirement, RequirementStatus, RequirementChangeLog } from '@req2task/core';

describe('RequirementStateService', () => {
  let service: RequirementStateService;
  let requirementRepository: jest.Mocked<Repository<Requirement>>;
  let changeLogRepository: jest.Mocked<Repository<RequirementChangeLog>>;

  beforeEach(async () => {
    const mockRequirementRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockChangeLogRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementStateService,
        {
          provide: getRepositoryToken(Requirement),
          useValue: mockRequirementRepository,
        },
        {
          provide: getRepositoryToken(RequirementChangeLog),
          useValue: mockChangeLogRepository,
        },
      ],
    }).compile();

    service = module.get<RequirementStateService>(RequirementStateService);
    requirementRepository = module.get(getRepositoryToken(Requirement));
    changeLogRepository = module.get(getRepositoryToken(RequirementChangeLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canTransition', () => {
    it('should allow transition from DRAFT to REVIEWED', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.DRAFT,
        RequirementStatus.REVIEWED,
      );
      expect(canTransition).toBe(true);
    });

    it('should allow transition from DRAFT to CANCELLED', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.DRAFT,
        RequirementStatus.CANCELLED,
      );
      expect(canTransition).toBe(true);
    });

    it('should allow transition from REVIEWED to APPROVED', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.REVIEWED,
        RequirementStatus.APPROVED,
      );
      expect(canTransition).toBe(true);
    });

    it('should allow transition from REVIEWED to REJECTED', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.REVIEWED,
        RequirementStatus.REJECTED,
      );
      expect(canTransition).toBe(true);
    });

    it('should not allow transition from DRAFT to APPROVED', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.DRAFT,
        RequirementStatus.APPROVED,
      );
      expect(canTransition).toBe(false);
    });

    it('should not allow transition from COMPLETED to any status', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.COMPLETED,
        RequirementStatus.DRAFT,
      );
      expect(canTransition).toBe(false);
    });

    it('should allow same status transition', async () => {
      const canTransition = await service.canTransition(
        RequirementStatus.DRAFT,
        RequirementStatus.DRAFT,
      );
      expect(canTransition).toBe(true);
    });
  });

  describe('transitionStatus', () => {
    it('should transition status successfully', async () => {
      const requirement = {
        id: '1',
        status: RequirementStatus.DRAFT,
      } as Requirement;

      requirementRepository.findOne.mockResolvedValue(requirement);
      requirementRepository.save.mockResolvedValue({
        ...requirement,
        status: RequirementStatus.REVIEWED,
      });
      changeLogRepository.create.mockReturnValue({} as RequirementChangeLog);
      changeLogRepository.save.mockResolvedValue({} as RequirementChangeLog);

      const result = await service.transitionStatus(
        '1',
        RequirementStatus.REVIEWED,
        'user-1',
      );

      expect(result.status).toBe(RequirementStatus.REVIEWED);
      expect(changeLogRepository.save).toHaveBeenCalled();
    });

    it('should throw error if requirement not found', async () => {
      requirementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.transitionStatus('1', RequirementStatus.REVIEWED, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if transition not allowed', async () => {
      const requirement = {
        id: '1',
        status: RequirementStatus.DRAFT,
      } as Requirement;

      requirementRepository.findOne.mockResolvedValue(requirement);

      await expect(
        service.transitionStatus('1', RequirementStatus.COMPLETED, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for DRAFT', async () => {
      const transitions = await service.getAllowedTransitions(
        RequirementStatus.DRAFT,
      );
      expect(transitions).toContain(RequirementStatus.REVIEWED);
      expect(transitions).toContain(RequirementStatus.CANCELLED);
    });

    it('should return empty array for COMPLETED', async () => {
      const transitions = await service.getAllowedTransitions(
        RequirementStatus.COMPLETED,
      );
      expect(transitions).toEqual([]);
    });
  });

  describe('reviewRequirement', () => {
    it('should approve requirement', async () => {
      const requirement = {
        id: '1',
        status: RequirementStatus.REVIEWED,
      } as Requirement;

      requirementRepository.findOne.mockResolvedValue(requirement);
      requirementRepository.save.mockResolvedValue({
        ...requirement,
        status: RequirementStatus.APPROVED,
      });
      changeLogRepository.create.mockReturnValue({} as RequirementChangeLog);
      changeLogRepository.save.mockResolvedValue({} as RequirementChangeLog);

      const result = await service.reviewRequirement('1', true, 'user-1');

      expect(result.status).toBe(RequirementStatus.APPROVED);
    });

    it('should reject requirement', async () => {
      const requirement = {
        id: '1',
        status: RequirementStatus.REVIEWED,
      } as Requirement;

      requirementRepository.findOne.mockResolvedValue(requirement);
      requirementRepository.save.mockResolvedValue({
        ...requirement,
        status: RequirementStatus.REJECTED,
      });
      changeLogRepository.create.mockReturnValue({} as RequirementChangeLog);
      changeLogRepository.save.mockResolvedValue({} as RequirementChangeLog);

      const result = await service.reviewRequirement('1', false, 'user-1');

      expect(result.status).toBe(RequirementStatus.REJECTED);
    });
  });

  describe('getChangeHistory', () => {
    it('should return change history', async () => {
      const mockLogs = [
        {
          id: '1',
          requirementId: 'req-1',
          changeType: 'status_change',
          changedBy: { id: 'user-1', displayName: 'Test', username: 'test' },
        },
      ] as RequirementChangeLog[];

      changeLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getChangeHistory('req-1');

      expect(result).toEqual(mockLogs);
      expect(changeLogRepository.find).toHaveBeenCalledWith({
        where: { requirementId: 'req-1' },
        relations: ['changedBy'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});
