import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus, User, UserRole } from '@req2task/core';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: any;
  let userRepository: any;

  const mockOwner: User = {
    id: 'owner-uuid',
    username: 'owner',
    email: 'owner@test.com',
    displayName: 'Owner User',
    role: UserRole.PROJECT_MANAGER,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject: Project = {
    id: 'project-uuid',
    name: 'Test Project',
    description: 'Test Description',
    projectKey: 'TEST',
    status: ProjectStatus.PLANNING,
    startDate: null,
    endDate: null,
    ownerId: 'owner-uuid',
    members: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    projectRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      projectRepository.findAndCount.mockResolvedValue([[mockProject], 1]);

      const result = await service.findAll(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Test Project');
    });
  });

  describe('findById', () => {
    it('should return project by id', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findById('project-uuid');

      expect(result.id).toBe('project-uuid');
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      projectRepository.findOne.mockResolvedValue(null);
      projectRepository.create.mockReturnValue(mockProject);
      projectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(
        { name: 'Test Project', projectKey: 'TEST' },
        'owner-uuid',
      );

      expect(result.name).toBe('Test Project');
    });

    it('should throw ConflictException when project key exists', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);

      await expect(
        service.create({ name: 'Test', projectKey: 'TEST' }, 'owner-uuid'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update('project-uuid', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('project-uuid')).resolves.not.toThrow();
    });
  });

  describe('addMember', () => {
    it('should add member to project', async () => {
      const projectWithMember = { ...mockProject, members: [mockOwner] };
      projectRepository.findOne.mockResolvedValue(mockProject);
      userRepository.findOne.mockResolvedValue(mockOwner);
      projectRepository.save.mockResolvedValue(projectWithMember);

      const result = await service.addMember('project-uuid', { userId: 'owner-uuid' });

      expect(result.members).toHaveLength(1);
    });

    it('should throw ConflictException when user is already member', async () => {
      projectRepository.findOne.mockResolvedValue({ ...mockProject, members: [mockOwner] });
      userRepository.findOne.mockResolvedValue(mockOwner);

      await expect(
        service.addMember('project-uuid', { userId: 'owner-uuid' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should remove member from project', async () => {
      projectRepository.findOne.mockResolvedValue({ ...mockProject, members: [mockOwner] });
      projectRepository.save.mockResolvedValue({ ...mockProject, members: [] });

      const result = await service.removeMember('project-uuid', 'owner-uuid');

      expect(result.members).toHaveLength(0);
    });
  });
});
