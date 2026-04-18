var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
export var CollectionType;
(function (CollectionType) {
    CollectionType["MEETING"] = "meeting";
    CollectionType["INTERVIEW"] = "interview";
    CollectionType["DOCUMENT"] = "document";
    CollectionType["OTHER"] = "other";
})(CollectionType || (CollectionType = {}));
export class CreateRawRequirementCollectionDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateRawRequirementCollectionDto.prototype, "projectId", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateRawRequirementCollectionDto.prototype, "title", void 0);
__decorate([
    IsEnum(CollectionType),
    __metadata("design:type", String)
], CreateRawRequirementCollectionDto.prototype, "collectionType", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], CreateRawRequirementCollectionDto.prototype, "collectedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateRawRequirementCollectionDto.prototype, "meetingMinutes", void 0);
export class UpdateRawRequirementCollectionDto {
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateRawRequirementCollectionDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsEnum(CollectionType),
    __metadata("design:type", String)
], UpdateRawRequirementCollectionDto.prototype, "collectionType", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], UpdateRawRequirementCollectionDto.prototype, "collectedAt", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateRawRequirementCollectionDto.prototype, "meetingMinutes", void 0);
