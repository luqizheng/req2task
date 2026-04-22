import { UserRole } from '../../enums';

/**
 * @public
 */
export class UserResponseDto {
  id!: string;
  username!: string;
  email!: string;
  displayName!: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * @public
 */
export class UserListResponseDto {
  items!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class PublicUserDto {
  id!: string;
  displayName!: string;
}

/**
 * @public
 */
export class PublicUserListResponseDto {
  items!: PublicUserDto[];
  total!: number;
  page!: number;
  limit!: number;
}
