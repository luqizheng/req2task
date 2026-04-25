import api from "./axios";
import type {
  CreateRawRequirementInput,
  CollectionType,
  RawRequirementResponseDto,
  CreateRawRequirementDto,
  UpdateRawRequirementDto,
  RawRequirementListParams,
} from "@req2task/dto";
import { RawRequirementStatus } from "@req2task/dto";

export type {
  CreateRawRequirementInput,
  CollectionType,
  RawRequirementResponseDto,
  RawRequirementListParams,
};
export { RawRequirementStatus };

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
  ): Promise<RawRequirementResponseDto> => {
    return api.post(
      `/raw-requirements/${projectId}/raw-requirements`,
      data,
    );
  },
  update: (
    rawRequirementId: string,
    data: UpdateRawRequirementDto,
  ): Promise<RawRequirementResponseDto> => {
    return api.put(
      `/raw-requirements/${rawRequirementId}`,
      data,
    );
  },
  getByProject: (
    projectId: string,
    params: RawRequirementListParams,
  ): Promise<RawRequirementResponseDto[]> => {
    return api.get(
      `/raw-requirements/${projectId}/raw-requirements`,
      { params },
    );
  },
};
