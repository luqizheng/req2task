import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateMeDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}
