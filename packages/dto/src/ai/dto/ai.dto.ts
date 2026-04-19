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
import { LLMProviderType } from '../../enums';

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
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

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
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

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
  metadata?: Record<string, unknown>;
}

export class VectorStoreRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VectorDocumentDto)
  documents!: VectorDocumentDto[];
}

export class LLMConfigResponseDto {
  id!: string;
  name!: string;
  provider!: LLMProviderType;
  modelName!: string;
  baseUrl!: string | null;
  maxTokens!: number;
  temperature!: number;
  topP!: number;
  isActive!: boolean;
  isDefault!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  apiKey?: string;
}

export class ChatResponseDto {
  content!: string;
  configId?: string;
}

export class TestLLMConfigDto {
  @IsString()
  configId!: string;

  @IsOptional()
  @IsString()
  testMessage?: string;
}

export class TestLLMResponseDto {
  success!: boolean;
  content!: string;
  configId!: string;
  latencyMs?: number;
  error?: string;
}

export class PromptTemplateResponseDto {
  code!: string;
  name!: string;
  category!: string;
  description!: string;
  systemPrompt!: string;
  userPromptTemplate!: string;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
  parameters!: Array<{
    name: string;
    type: string;
    required?: boolean;
    defaultValue?: string;
    description?: string;
  }>;
}
