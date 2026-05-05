import type {
  WizardStepDto,
  WizardFieldDto,
  TechStackDto,
  CreateProjectFromWizardDto,
} from '@req2task/dto';

export interface WizardFormData {
  name: string;
  description?: string;
  businessDomain?: string;
  systemType?: string;
  targetAudience?: string;
  architectureType?: string;
  isMicroservices?: boolean;
  techStack?: Partial<TechStackDto>;
  databaseTypes?: string[];
  backend?: {
    orm?: string;
  };
  cloudProvider?: string;
  securityLevel?: string;
  projectScale?: string;
  teamSize?: number;
  expectedDurationMonths?: number;
  budget?: number;
}

export interface WizardContext {
  projectId?: string;
  currentStep: number;
  totalSteps: number;
  formData: Partial<WizardFormData>;
  techStackSuggestion?: TechStackDto;
  aiSuggestion?: {
    suggestions: Record<string, unknown>;
    reason?: string;
  };
}

export type WizardFieldType = WizardFieldDto['type'];

export interface WizardStepConfig extends WizardStepDto {
  isActive: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
}

export interface CreateProjectPayload extends CreateProjectFromWizardDto {
  projectKey: string;
}

export { type WizardStepDto, type WizardFieldDto, type TechStackDto };
