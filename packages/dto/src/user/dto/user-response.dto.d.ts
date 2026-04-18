import { UserRole } from '../../enums';
export declare class UserResponseDto {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserListResponseDto {
    items: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class PublicUserDto {
    id: string;
    displayName: string;
}
export declare class PublicUserListResponseDto {
    items: PublicUserDto[];
    total: number;
    page: number;
    limit: number;
}
