export class UserResponseDto {
  id!: string
  username!: string
  email!: string
  nickname?: string
  createdAt!: Date
  updatedAt!: Date
}

export class UserListResponseDto {
  id!: string
  username!: string
  nickname?: string
}
