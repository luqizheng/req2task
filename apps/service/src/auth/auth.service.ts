import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@req2task/core';
import { UserRole } from '@req2task/dto';
import {
  RegisterRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  UserResponseDto,
} from '@req2task/dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterRequestDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('Username already exists');
      }
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const userCount = await this.userRepository.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      displayName: registerDto.displayName,
      passwordHash,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    return this.toUserResponseDto(savedUser);
  }

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
