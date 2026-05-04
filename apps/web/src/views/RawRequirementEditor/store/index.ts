import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  RawRequirementResponseDto,
  RawRequirementQADto,
  AiGeneratedRequirementDto,
  RequirementResponseDto,
} from "@req2task/dto";
import { RawRequirementStatus } from "@req2task/dto";

export type AiQuestion = Pick<RawRequirementQADto, "question" | "purpose">;

export interface SimilarRequirement {
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface RequirementCheckResult {
  requirementId: string;
  hasDuplicate: boolean;
  duplicateRequirements: SimilarRequirement[];
  hasConflict: boolean;
  conflictDescription?: string;
  conflictRequirements: SimilarRequirement[];
}

export interface RequirementCheckSummary {
  results: RequirementCheckResult[];
  totalDuplicates: number;
  totalConflicts: number;
}

function createDefaultRawRequirement(): RawRequirementResponseDto {
  return {
    entityKey: '',
    id: "",
    projectId: "",
    collectionType: undefined,
    title: null,
    content: "",
    source: "",
    collectTime: null,
    status: RawRequirementStatus.PENDING,
    questionAndAnswers: [],
    keyElements: [],
    createdAt: "",
    updatedAt: "",
    fileIds: [],
  };
}

function isTemporaryId(id: string): boolean {
  return id.startsWith("sse_") || id.startsWith("qa_");
}

function convertToAiGeneratedRequirement(
  dto: RequirementResponseDto,
): AiGeneratedRequirementDto {
  return {
    id: dto.id,
    entityKey: dto.entityKey,
    title: dto.title,
    content: dto.description || "",
    keyElements: [],
    priority: dto.priority,
    source: dto.source,
    status: dto.status,
    type: "功能需求",
    storyPoints: dto.storyPoints,
    moduleId: dto.modules?.[0]?.id || null,
    parentId: dto.parentId,
  };
}

export const useRawRequirementCreateStore = defineStore(
  "rawRequirementCreate",
  () => {
    const rawRequirement = ref<RawRequirementResponseDto>(
      createDefaultRawRequirement(),
    );
    const projectId = ref("");
    const deletedQuestionIds = ref<Set<string>>(new Set());
    const questionFilter = ref<"all" | "pending" | "answered">("all");
    const messageHistory = ref<Array<{ role: "user"; content: string }>>([]);
    const requirements = ref<AiGeneratedRequirementDto[]>([]);
    const requirementCheckResult = ref<RequirementCheckSummary | null>(null);

    const allVisibleQuestions = computed(() =>
      rawRequirement.value.questionAndAnswers.filter(
        (q) => !deletedQuestionIds.value.has(q.id),
      ),
    );

    const visibleQuestions = computed(() => {
      const questions = allVisibleQuestions.value;
      switch (questionFilter.value) {
        case "pending":
          return questions.filter((q) => !q.answer);
        case "answered":
          return questions.filter((q) => !!q.answer);
        default:
          return questions;
      }
    });

    const answeredQuestions = computed(() =>
      allVisibleQuestions.value.filter((q) => !!q.answer),
    );

    const hasQuestions = computed(() => allVisibleQuestions.value.length > 0);

    const hasAnsweredQuestions = computed(
      () => answeredQuestions.value.length > 0,
    );

    const setQuestionsFromSSE = (
      data: RawRequirementResponseDto | null,
      sseData?: { keyElements?: string[]; questions?: AiQuestion[] },
    ) => {
      if (data && data.id) {
        rawRequirement.value = { ...rawRequirement.value, ...data };
      }

      if (sseData?.questions && sseData.questions.length > 0) {
        rawRequirement.value.questionAndAnswers = sseData.questions.map(
          (q, index) => ({
            id: `sse_q_${Date.now()}_${index}`,
            question: q.question,
            answer: null,
            purpose: q.purpose,
            createdAt: new Date().toISOString(),
            answeredAt: null,
          }),
        );
      }
      deletedQuestionIds.value = new Set();
    };

    const addQuestion = (
      question: string,
      answer: string = "",
      purpose?: string,
    ) => {
      rawRequirement.value.questionAndAnswers.push({
        id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer: answer || null,
        purpose,
        createdAt: new Date().toISOString(),
        answeredAt: answer ? new Date().toISOString() : null,
      });
    };

    const addQuestionFromSSE = (q: AiQuestion) => {
      const exists = rawRequirement.value.questionAndAnswers.some(
        (item) => item.question === q.question,
      );
      if (exists) return;

      rawRequirement.value.questionAndAnswers.push({
        id: `sse_q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: q.question,
        answer: null,
        purpose: q.purpose,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      });
    };

    const updateQuestion = (
      id: string,
      updates: Partial<RawRequirementQADto>,
    ) => {
      const index = rawRequirement.value.questionAndAnswers.findIndex(
        (q) => q.id === id,
      );
      if (index !== -1) {
        const updated = {
          ...rawRequirement.value.questionAndAnswers[index],
          ...updates,
        };
        rawRequirement.value.questionAndAnswers.splice(index, 1, updated);
      }
    };

    const deleteQuestion = (id: string) => {
      if (isTemporaryId(id)) {
        const index = rawRequirement.value.questionAndAnswers.findIndex(
          (q) => q.id === id,
        );
        if (index !== -1) {
          rawRequirement.value.questionAndAnswers.splice(index, 1);
        }
        return;
      }
      deletedQuestionIds.value = new Set([...deletedQuestionIds.value, id]);
    };

    const restoreQuestion = (id: string) => {
      const newSet = new Set(deletedQuestionIds.value);
      newSet.delete(id);
      deletedQuestionIds.value = newSet;
    };

    const answerQuestion = (id: string, answer: string) => {
      updateQuestion(id, {
        answer,
        answeredAt: new Date().toISOString(),
      });
    };

    const setQuestionFilter = (filter: "all" | "pending" | "answered") => {
      questionFilter.value = filter;
    };

    const reset = () => {
      rawRequirement.value = createDefaultRawRequirement();
      deletedQuestionIds.value = new Set();
      questionFilter.value = "all";
    };

    const loadRawRequirement = (data: RawRequirementResponseDto) => {
      rawRequirement.value = { ...data };
      projectId.value = data.projectId;
      deletedQuestionIds.value = new Set();

      messageHistory.value = data.content
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => ({
          role: "user",
          content: line,
        }));
    };

    const setRequirements = (data: AiGeneratedRequirementDto[]) => {
      requirements.value = data;
    };

    const addRequirement = (requirement: AiGeneratedRequirementDto) => {
      const exists = requirements.value.some((r) => r.id === requirement.id);
      if (!exists) {
        requirements.value.push(requirement);
      }
    };

    const updateRequirement = (
      id: string,
      updates: Partial<AiGeneratedRequirementDto>,
    ) => {
      const index = requirements.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        requirements.value[index] = {
          ...requirements.value[index],
          ...updates,
        };
      }
    };

    const deleteRequirement = (id: string) => {
      const index = requirements.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        requirements.value.splice(index, 1);
      }
    };

    const getRequirementById = (id: string) => {
      return requirements.value.find((r) => r.id === id);
    };

    const clearRequirements = () => {
      requirements.value = [];
    };

    const updateRequirementId = (tempId: string, newId: string) => {
      const index = requirements.value.findIndex((r) => r.id === tempId);
      if (index !== -1) {
        requirements.value[index] = {
          ...requirements.value[index],
          id: newId,
        };
      }
    };

    const loadRequirementsByRawRequirement = (
      _rawRequirementId: string,
      data: RequirementResponseDto[],
    ) => {
      requirements.value = data.map(convertToAiGeneratedRequirement);
    };

    const setRequirementCheckResult = (result: RequirementCheckSummary | null) => {
      requirementCheckResult.value = result;
    };

    const getCheckResultForRequirement = (requirementId: string) => {
      return requirementCheckResult.value?.results.find(
        (r) => r.requirementId === requirementId,
      );
    };

    const clearRequirementCheckResult = () => {
      requirementCheckResult.value = null;
    };

    return {
      requirements,
      rawRequirement,
      deletedQuestionIds,
      questionFilter,
      projectId,
      visibleQuestions,

      answeredQuestions,

      hasQuestions,
      hasAnsweredQuestions,
      setQuestionsFromSSE,
      addQuestion,
      addQuestionFromSSE,
      updateQuestion,
      deleteQuestion,
      restoreQuestion,
      answerQuestion,
      setQuestionFilter,
      reset,
      messageHistory,
      loadRawRequirement,
      setRequirements,
      addRequirement,
      updateRequirement,
      deleteRequirement,
      getRequirementById,
      clearRequirements,
      updateRequirementId,
      loadRequirementsByRawRequirement,
      requirementCheckResult,
      setRequirementCheckResult,
      getCheckResultForRequirement,
      clearRequirementCheckResult,
    };
  },
);
