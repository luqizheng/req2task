import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LLMProviderType } from '@req2task/core';

export class CreateLLMConfigDto {
  @IsString()
  name!: string;

  @IsEnum(LLMProviderType)
  provider!: LLMProviderType;

  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsString()
  modelName!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateLLMConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ChatRequestDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  configId?: string;
}

export class VectorDocumentDto {
  @IsString()
  id!: string;

  @IsString()
  content!: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class VectorStoreRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VectorDocumentDto)
  documents!: VectorDocumentDto[];
}
