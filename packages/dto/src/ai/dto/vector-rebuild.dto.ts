export interface RebuildVectorRequestDto {
  projectId?: string;
  clean?: boolean;
}

export interface RebuildVectorResponseDto {
  success: boolean;
  message: string;
  data?: {
    requirements: number;
    rawRequirements: number;
    total: number;
  };
}
