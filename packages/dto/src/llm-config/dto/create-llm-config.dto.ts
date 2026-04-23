import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { LLMProviderType } from '../../enums';

export class CreateLlmConfigDto {
  @IsString()
  name!: string;

  @IsEnum(LLMProviderType)
  provider!: LLMProviderType;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100000)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
