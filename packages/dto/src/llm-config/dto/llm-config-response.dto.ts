import { LLMProviderType } from '../../enums';

export class LlmConfigResponseDto {
  id!: string;
  name!: string;
  provider!: LLMProviderType;
  modelName!: string | null;
  baseUrl!: string | null;
  maxTokens!: number;
  temperature!: number;
  topP!: number;
  isDefault!: boolean;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class LlmConfigDetailResponseDto extends LlmConfigResponseDto {
  apiKey!: string | null;
}

export class LlmConfigListResponseDto {
  configs!: LlmConfigResponseDto[];
  total!: number;
}

export class CreateLlmConfigResponseDto extends LlmConfigDetailResponseDto {}

export class UpdateLlmConfigResponseDto extends LlmConfigDetailResponseDto {}
