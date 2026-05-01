import { Priority, RequirementSource, RequirementStatus } from '../enums';

export type RequirementType =
  | "功能需求"
  | "性能需求"
  | "安全需求"
  | "接口需求"
  | "数据需求"
  | "用户体验需求";

export interface AiGeneratedRequirementDto {
  id: string;
  entityKey?: string;
  projectId?: string;
  title: string;
  content: string;
  keyElements: string[];
  priority: Priority;
  source: RequirementSource;
  status: RequirementStatus;
  type: RequirementType;
  storyPoints: number;
  moduleId: string | "NEW" | null;
  parentId: string | null;
}

export interface AiGeneratedRequirementsResponseDto {
  projectId: string;
  requirements: AiGeneratedRequirementDto[];
}
