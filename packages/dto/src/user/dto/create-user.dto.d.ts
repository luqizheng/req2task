import { UserRole } from '../../enums';
export declare class CreateUserDto {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role?: UserRole;
}
export declare class UpdateUserDto {
    username?: string;
    email?: string;
    displayName?: string;
    role?: UserRole;
}
export declare class UpdateMeDto {
    email?: string;
    displayName?: string;
}
export declare class ChangePasswordDto {
    newPassword: string;
}
