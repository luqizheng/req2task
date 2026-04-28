import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  RawRequirementResponseDto,
  RawRequirementQADto,
} from "@req2task/dto";
import { RawRequirementStatus } from "@req2task/dto";

export type AiQuestion = Pick<RawRequirementQADto, "question" | "purpose">;

function createDefaultRawRequirement(): RawRequirementResponseDto {
  return {
    id: "",
    projectId: "",
    collectionType: undefined,
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
    const requirements = ref<RawRequirementResponseDto[]>([]);

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

    const pendingQuestions = computed(() =>
      allVisibleQuestions.value.filter((q) => !q.answer),
    );

    const answeredQuestions = computed(() =>
      allVisibleQuestions.value.filter((q) => !!q.answer),
    );

    const deletedQuestions = computed(() =>
      rawRequirement.value.questionAndAnswers.filter((q) =>
        deletedQuestionIds.value.has(q.id),
      ),
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

      messageHistory.value =  data.content.split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        role: "user",
        content: line,
      }))
    };

    return {
      requirements,
      rawRequirement,
      deletedQuestionIds,
      questionFilter,
      projectId,
      visibleQuestions,
      pendingQuestions,
      answeredQuestions,
      deletedQuestions,
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
    };
  },
);
