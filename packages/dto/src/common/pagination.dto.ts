export interface PaginationDto {
  page: number
  pageSize: number
  total: number
}

export interface PaginatedResponseDto<T> {
  data: T[]
  pagination: PaginationDto
}
