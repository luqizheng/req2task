var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CriteriaType } from '../../enums';
export class CreateAcceptanceCriteriaDto {
}
__decorate([
    IsEnum(CriteriaType),
    __metadata("design:type", String)
], CreateAcceptanceCriteriaDto.prototype, "criteriaType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateAcceptanceCriteriaDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateAcceptanceCriteriaDto.prototype, "testMethod", void 0);
export class UpdateAcceptanceCriteriaDto {
}
__decorate([
    IsOptional(),
    IsEnum(CriteriaType),
    __metadata("design:type", String)
], UpdateAcceptanceCriteriaDto.prototype, "criteriaType", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAcceptanceCriteriaDto.prototype, "content", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateAcceptanceCriteriaDto.prototype, "testMethod", void 0);
export class AcceptanceCriteriaResponseDto {
}
