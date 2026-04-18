var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max, } from 'class-validator';
import { Type } from 'class-transformer';
import { LLMProviderType } from '../../enums';
export class CreateLLMConfigDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateLLMConfigDto.prototype, "name", void 0);
__decorate([
    IsEnum(LLMProviderType),
    __metadata("design:type", String)
], CreateLLMConfigDto.prototype, "provider", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateLLMConfigDto.prototype, "apiKey", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLLMConfigDto.prototype, "baseUrl", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateLLMConfigDto.prototype, "modelName", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], CreateLLMConfigDto.prototype, "maxTokens", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(2),
    __metadata("design:type", Number)
], CreateLLMConfigDto.prototype, "temperature", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(1),
    __metadata("design:type", Number)
], CreateLLMConfigDto.prototype, "topP", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateLLMConfigDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateLLMConfigDto.prototype, "isDefault", void 0);
export class UpdateLLMConfigDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLLMConfigDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLLMConfigDto.prototype, "apiKey", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLLMConfigDto.prototype, "baseUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateLLMConfigDto.prototype, "modelName", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], UpdateLLMConfigDto.prototype, "maxTokens", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(2),
    __metadata("design:type", Number)
], UpdateLLMConfigDto.prototype, "temperature", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(1),
    __metadata("design:type", Number)
], UpdateLLMConfigDto.prototype, "topP", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateLLMConfigDto.prototype, "isActive", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateLLMConfigDto.prototype, "isDefault", void 0);
export class ChatRequestDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "message", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ChatRequestDto.prototype, "configId", void 0);
export class VectorDocumentDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], VectorDocumentDto.prototype, "id", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], VectorDocumentDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], VectorDocumentDto.prototype, "metadata", void 0);
export class VectorStoreRequestDto {
}
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => VectorDocumentDto),
    __metadata("design:type", Array)
], VectorStoreRequestDto.prototype, "documents", void 0);
export class LLMConfigResponseDto {
}
export class ChatResponseDto {
}
export class PromptTemplateResponseDto {
}
