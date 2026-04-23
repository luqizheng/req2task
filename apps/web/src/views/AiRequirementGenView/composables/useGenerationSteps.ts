import { reactive, computed } from 'vue';
import type { GenerateRequirementResponse, UserStory } from '@/api/ai';

export interface GenerationStep {
  key: string;
  label: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export function useGenerationSteps() {
  const steps = reactive<GenerationStep[]>([
    { key: 'requirement', label: '生成需求', status: 'pending' },
    { key: 'userStory', label: '生成用户故事', status: 'pending' },
    { key: 'criteria', label: '生成验收条件', status: 'pending' },
  ]);

  const currentStep = computed(() => {
    const completedIndex = steps.findIndex((s) => s.status !== 'completed');
    return completedIndex === -1 ? steps.length : completedIndex;
  });

  const updateStepStatus = (key: string, status: GenerationStep['status']) => {
    const step = steps.find((s) => s.key === key);
    if (step) {
      step.status = status;
    }
  };

  const resetSteps = () => {
    steps.forEach((s) => (s.status = 'pending'));
  };

  const isGenerating = (key: string) => {
    const step = steps.find((s) => s.key === key);
    return step?.status === 'generating';
  };

  return {
    steps,
    currentStep,
    updateStepStatus,
    resetSteps,
    isGenerating,
  };
}

export interface EditableRequirement {
  title: string;
  description: string;
  priority: string;
  userStories: UserStory[];
  acceptanceCriteria: string[];
}

export function createEditableRequirement(): EditableRequirement {
  return {
    title: '',
    description: '',
    priority: 'medium',
    userStories: [],
    acceptanceCriteria: [],
  };
}

export function syncFromResponse(
  editable: EditableRequirement,
  response: GenerateRequirementResponse | null
) {
  if (!response) return;
  editable.title = response.title;
  editable.description = response.description;
  editable.priority = response.priority;
  editable.userStories = [...response.userStories];
  editable.acceptanceCriteria = [...response.acceptanceCriteria];
}
