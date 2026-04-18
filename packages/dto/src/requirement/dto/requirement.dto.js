var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, IsInt, Min, IsArray, } from 'class-validator';
import { Priority, RequirementSource, RequirementStatus, } from '../../enums';
export class CreateRequirementDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(Priority),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsEnum(RequirementSource),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "source", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "parentRequirementId", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], CreateRequirementDto.prototype, "moduleIds", void 0);
export class UpdateRequirementDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateRequirementDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateRequirementDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsEnum(Priority),
    __metadata("design:type", String)
], UpdateRequirementDto.prototype, "priority", void 0);
__decorate([
    IsOptional(),
    IsEnum(RequirementStatus),
    __metadata("design:type", String)
], UpdateRequirementDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateRequirementDto.prototype, "storyPoints", void 0);
export class UserSummaryDto {
}
export class UserStorySummaryDto {
}
export class ChildRequirementSummaryDto {
}
export class RequirementResponseDto {
}
export class RequirementListResponseDto {
}
