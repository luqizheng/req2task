import { UserRole } from '@req2task/core';

export class LoginResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: UserRole;
  };
}
