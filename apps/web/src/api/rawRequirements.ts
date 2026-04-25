import api from "./axios";
import type {
  CreateRawRequirementInput,
  CollectionType,
  RawRequirementResponseDto,
  CreateRawRequirementDto,
  UpdateRawRequirementDto,
} from "@req2task/dto";
import { RawRequirementStatus } from "@req2task/dto";

export type {
  CreateRawRequirementInput,
  CollectionType,
  RawRequirementResponseDto,
};
export { RawRequirementStatus };

export interface RawRequirementListParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatResult {
  assistantMessage: string;
  followUpQuestions: string[];
  isComplete: boolean;
  questionCount?: number;
}

export interface RawRequirementStreamOptions {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

export const rawRequirementsApi = {
  getRawRequirement: (
    rawRequirementId: string,
  ): Promise<RawRequirementResponseDto> => {
    return api.get(`/raw-requirements/${rawRequirementId}`);
  },

  deleteRawRequirement: (rawRequirementId: string): Promise<void> => {
    return api.delete(`/raw-requirements/${rawRequirementId}`);
  },

  create: (
    projectId: string,
    data: CreateRawRequirementDto,
  ): Promise<{
    code: number;
    success: boolean;
    data?: RawRequirementResponseDto;
  }> => {
    return api.post(
      `/raw-requirements/${projectId}/raw-requirements`,
      data,
    );
  },
  update: (
    rawRequirementId: string,
    data: UpdateRawRequirementDto,
  ): Promise<{
    code: number;
    success: boolean;
    data?: RawRequirementResponseDto;
  }> => {
    return api.put(
      `/raw-requirements/${rawRequirementId}`,
      data,
    );
  },
};
