import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FeatureModulesService } from './feature-modules.service';
import { FeatureModule, Project } from '@req2task/core';

interface MockRepository {
  findAndCount: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
  find: jest.Mock;
}

describe('FeatureModulesService', () => {
  let service: FeatureModulesService;
  let featureModuleRepository: MockRepository;

  const mockModule: FeatureModule = {
    id: 'module-uuid',
    name: 'Test Module',
    description: 'Test Description',
    moduleKey: 'TEST-MOD',
    sort: 0,
    parentId: null,
    parent: null,
    children: [],
    projectId: 'project-uuid',
    project: null as unknown as Project,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChildModule: FeatureModule = {
    ...mockModule,
    id: 'child-uuid',
    name: 'Child Module',
    moduleKey: 'CHILD-MOD',
    parentId: 'module-uuid',
    parent: mockModule,
  };

  beforeEach(async () => {
    featureModuleRepository = {
      findAndCount: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureModulesService,
        {
          provide: getRepositoryToken(FeatureModule),
          useValue: featureModuleRepository,
        },
      ],
    }).compile();

    service = module.get<FeatureModulesService>(FeatureModulesService);
  });

  describe('findByProject', () => {
    it('should return paginated modules', async () => {
      featureModuleRepository.findAndCount.mockResolvedValue([[mockModule], 1]);

      const result = await service.findByProject('project-uuid', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return module by id', async () => {
      featureModuleRepository.findOne.mockResolvedValue(mockModule);

      const result = await service.findById('module-uuid');

      expect(result.id).toBe('module-uuid');
    });

    it('should throw NotFoundException when module not found', async () => {
      featureModuleRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new module', async () => {
      featureModuleRepository.findOne.mockResolvedValue(null);
      featureModuleRepository.create.mockReturnValue(mockModule);
      featureModuleRepository.save.mockResolvedValue(mockModule);

      const result = await service.create({
        name: 'Test Module',
        moduleKey: 'TEST-MOD',
        projectId: 'project-uuid',
      });

      expect(result.name).toBe('Test Module');
    });

    it('should throw ConflictException when module key exists', async () => {
      featureModuleRepository.findOne.mockResolvedValue(mockModule);

      await expect(
        service.create({ name: 'Test', moduleKey: 'TEST-MOD', projectId: 'project-uuid' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when parent not found', async () => {
      featureModuleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          moduleKey: 'TEST',
          projectId: 'project-uuid',
          parentId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update module', async () => {
      const updatedModule = { ...mockModule, name: 'Updated Name' };
      featureModuleRepository.findOne.mockResolvedValue(mockModule);
      featureModuleRepository.save.mockResolvedValue(updatedModule);

      const result = await service.update('module-uuid', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw ConflictException when setting itself as parent', async () => {
      featureModuleRepository.findOne.mockResolvedValue(mockModule);

      await expect(
        service.update('module-uuid', { parentId: 'module-uuid' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete module', async () => {
      featureModuleRepository.findOne.mockResolvedValue(mockModule);
      featureModuleRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('module-uuid')).resolves.not.toThrow();
    });

    it('should throw ConflictException when module has children', async () => {
      featureModuleRepository.findOne.mockResolvedValue({
        ...mockModule,
        children: [mockChildModule],
      });

      await expect(service.delete('module-uuid')).rejects.toThrow(ConflictException);
    });
  });
});
