export interface ApiResponseDto<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiErrorDto {
  code: string
  message: string
  details?: Record<string, unknown>
}
