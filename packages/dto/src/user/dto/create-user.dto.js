var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsEnum, IsOptional, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole } from '../../enums';
export class CreateUserDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    IsEmail(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MinLength(6),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "displayName", void 0);
__decorate([
    IsEnum(UserRole),
    IsOptional(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
export class UpdateUserDto {
}
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "username", void 0);
__decorate([
    IsEmail(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "displayName", void 0);
__decorate([
    IsEnum(UserRole),
    IsOptional(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
export class UpdateMeDto {
}
__decorate([
    IsEmail(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "email", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], UpdateMeDto.prototype, "displayName", void 0);
export class ChangePasswordDto {
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MinLength(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
