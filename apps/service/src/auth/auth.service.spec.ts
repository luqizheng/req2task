import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '@req2task/core';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

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
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      });

      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException when username exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return access token and user info on successful login', async () => {
      const passwordHash = await require('bcrypt').hash('password123', 10);
      const userWithHash = { ...mockUser, passwordHash };
      userRepository.findOne.mockResolvedValue(userWithHash);

      const result = await service.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('username', 'testuser');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          username: 'nonexistent',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const passwordHash = await require('bcrypt').hash('correctpassword', 10);
      const userWithHash = { ...mockUser, passwordHash };
      userRepository.findOne.mockResolvedValue(userWithHash);

      await expect(
        service.login({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
