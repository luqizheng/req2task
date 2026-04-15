import { UserRole } from '@req2task/core';

export class UserResponseDto {
  id!: string;
  username!: string;
  email!: string;
  displayName!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserListResponseDto {
  items!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
