var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RequirementStatus } from '../../enums';
export class TransitionStatusDto {
}
__decorate([
    IsEnum(RequirementStatus),
    __metadata("design:type", String)
], TransitionStatusDto.prototype, "targetStatus", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TransitionStatusDto.prototype, "comment", void 0);
export class ReviewRequirementDto {
}
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], ReviewRequirementDto.prototype, "approved", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ReviewRequirementDto.prototype, "comment", void 0);
export class AllowedTransitionsDto {
}
export class RequirementChangeLogDto {
}
export class ChangeHistoryResponseDto {
}
