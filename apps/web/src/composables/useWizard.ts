import { ref, computed } from "vue";
import type { RawRequirementResponseDto } from "@req2task/dto";

export interface QAItem {
  id: string;
  question: string;
  answer: string;
  isAnswered: boolean;
  isDeleted: boolean;
  isManuallyAdded: boolean;
}

export interface GeneratedRequirement {
  id: string;
  title: string;
  description: string;
  priority: string;
  acceptanceCriteria?: string[];
  userStories?: Array<{
    role: string;
    goal: string;
    benefit: string;
  }>;
}

export interface WizardState {
  currentStep: 1 | 2 | 3;
  rawRequirement: RawRequirementResponseDto | null;
  questions: QAItem[];
  generatedRequirement: GeneratedRequirement | null;
}

export interface UseWizardOptions {
  projectId: string;
  onComplete?: (requirement: GeneratedRequirement) => void;
}

export function useWizard(options: UseWizardOptions) {
  const currentStep = ref<1 | 2 | 3>(1);
  const rawRequirement = ref<RawRequirementResponseDto | null>(null);
  const questions = ref<QAItem[]>([]);
  const generatedRequirement = ref<GeneratedRequirement | null>(null);
  const isGenerating = ref(false);

  const pendingQuestions = computed(() =>
    questions.value.filter((q) => !q.isAnswered && !q.isDeleted)
  );

  const answeredQuestions = computed(() =>
    questions.value.filter((q) => q.isAnswered && !q.isDeleted)
  );

  const deletedQuestions = computed(() =>
    questions.value.filter((q) => q.isDeleted)
  );

  const canGenerate = computed(
    () => answeredQuestions.value.length > 0 && !isGenerating.value
  );

  const hasQuestions = computed(() => questions.value.length > 0);

  const goToStep = (step: 1 | 2 | 3) => {
    currentStep.value = step;
  };

  const nextStep = () => {
    if (currentStep.value < 3) {
      currentStep.value = (currentStep.value + 1) as 1 | 2 | 3;
    }
  };

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value = (currentStep.value - 1) as 1 | 2 | 3;
    }
  };

  const setRawRequirement = (data: RawRequirementResponseDto) => {
    rawRequirement.value = data;

    if (data.questionAndAnswers && data.questionAndAnswers.length > 0) {
      questions.value = data.questionAndAnswers.map((qa) => ({
        id: qa.id,
        question: qa.question,
        answer: qa.answer || "",
        isAnswered: !!qa.answer,
        isDeleted: false,
        isManuallyAdded: false,
      }));
    }

    goToStep(2);
  };

  const addQuestion = (question: string, answer: string = "") => {
    questions.value.push({
      id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      answer,
      isAnswered: !!answer,
      isDeleted: false,
      isManuallyAdded: true,
    });
  };

  const updateQuestion = (id: string, updates: Partial<QAItem>) => {
    const index = questions.value.findIndex((q) => q.id === id);
    if (index !== -1) {
      questions.value[index] = { ...questions.value[index], ...updates };
    }
  };

  const deleteQuestion = (id: string) => {
    const index = questions.value.findIndex((q) => q.id === id);
    if (index !== -1) {
      questions.value[index].isDeleted = true;
    }
  };

  const answerQuestion = (id: string, answer: string) => {
    updateQuestion(id, {
      answer,
      isAnswered: true,
    });
  };

  const setGeneratedRequirement = (data: GeneratedRequirement) => {
    generatedRequirement.value = data;
    goToStep(3);
    options.onComplete?.(data);
  };

  const setIsGenerating = (value: boolean) => {
    isGenerating.value = value;
  };

  const reset = () => {
    currentStep.value = 1;
    rawRequirement.value = null;
    questions.value = [];
    generatedRequirement.value = null;
    isGenerating.value = false;
  };

  return {
    currentStep,
    rawRequirement,
    questions,
    generatedRequirement,
    isGenerating,
    pendingQuestions,
    answeredQuestions,
    deletedQuestions,
    canGenerate,
    hasQuestions,
    goToStep,
    nextStep,
    prevStep,
    setRawRequirement,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    answerQuestion,
    setGeneratedRequirement,
    setIsGenerating,
    reset,
  };
}

export type UseWizardReturn = ReturnType<typeof useWizard>;
