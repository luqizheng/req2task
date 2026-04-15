import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@req2task/core';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
