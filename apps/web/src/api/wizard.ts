import type {
  WizardStepDto,
  WizardProgressDto,
  TechStackDto,
  TechStackSuggestionDto,
  AISuggestionRequestDto,
  AISuggestionResponseDto,
  CreateProjectFromWizardDto,
} from '@req2task/dto';
import type { ProjectResponseDto } from '@req2task/dto';
import api from './axios';

export const wizardApi = {
  getSteps: () => {
    return api.get<WizardStepDto[]>('/projects/wizard/steps');
  },

  getStep: (stepId: string) => {
    return api.get<WizardStepDto | null>(`/projects/wizard/steps/${stepId}`);
  },

  saveProgress: (progress: WizardProgressDto) => {
    return api.post<ProjectResponseDto>('/projects/wizard/progress', progress);
  },

  getProgress: (projectId: string) => {
    return api.get<WizardProgressDto | null>(`/projects/wizard/progress/${projectId}`);
  },

  getTechStackSuggestion: (data: TechStackSuggestionDto) => {
    return api.post<TechStackDto>('/projects/wizard/tech-stack-suggestion', data);
  },

  getAISuggestion: (data: AISuggestionRequestDto) => {
    return api.post<AISuggestionResponseDto>('/projects/wizard/suggest', data);
  },

  completeWizard: (data: CreateProjectFromWizardDto) => {
    return api.post<ProjectResponseDto>('/projects/wizard/complete', data);
  },
};
