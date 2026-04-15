import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '@req2task/core';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;

  const mockUser: User = {
    id: 'test-uuid-1',
    username: 'testuser',
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.USER,
    passwordHash: '$2b$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('test-uuid-1');

      expect(result.id).toBe('test-uuid-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      });

      expect(result.username).toBe('testuser');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when username exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('test-uuid-1', {
        displayName: 'Updated Name',
      });

      expect(result.displayName).toBe('Updated Name');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', { displayName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(undefined);

      await expect(service.delete('test-uuid-1')).resolves.not.toThrow();
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        passwordHash: 'new-hash',
      });

      await expect(
        service.updatePassword('test-uuid-1', { newPassword: 'newpassword' }),
      ).resolves.not.toThrow();
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = { ...mockUser, displayName: 'New Display Name' };
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('test-uuid-1', {
        displayName: 'New Display Name',
      });

      expect(result.displayName).toBe('New Display Name');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, id: 'different-id' });

      await expect(
        service.updateProfile('test-uuid-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
