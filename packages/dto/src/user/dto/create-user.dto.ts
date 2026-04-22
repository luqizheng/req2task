import { IsEmail, IsEnum, IsOptional, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../enums';

/**
 * @public
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

/**
 * @public
 */
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

/**
 * @public
 */
export class UpdateMeDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}

/**
 * @public
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
