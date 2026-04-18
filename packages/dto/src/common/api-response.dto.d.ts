export interface ApiResponseDto<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    time: string;
    url: string;
    method?: string;
    body?: Record<string, unknown>;
}
export interface ApiErrorDto {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
