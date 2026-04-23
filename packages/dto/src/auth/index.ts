export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  displayName: string;
  password: string;
}

export interface UserInfoDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: UserInfoDto;
}

export interface RegisterResponseDto {
  message: string;
  user: Omit<UserInfoDto, 'role'>;
}