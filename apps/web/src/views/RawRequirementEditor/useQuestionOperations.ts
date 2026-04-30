import { ref } from "vue";
import { toast } from "vue-sonner";
import { useRawRequirementCreateStore } from "./store";

export function useQuestionOperations(store: ReturnType<typeof useRawRequirementCreateStore>) {
  const newQuestion = ref("");
  const newAnswer = ref("");
  const editingId = ref<string | null>(null);
  const editingAnswer = ref("");
  const showAddDialog = ref(false);

  const handleAddQuestion = () => {
    if (!newQuestion.value.trim()) {
      toast.warning("请输入问题内容");
      return;
    }
    store.addQuestion(newQuestion.value.trim(), newAnswer.value.trim());
    newQuestion.value = "";
    newAnswer.value = "";
    showAddDialog.value = false;
  };

  const handleEditAnswer = (id: string, currentAnswer: string) => {
    editingId.value = id;
    editingAnswer.value = currentAnswer;
  };

  const handleSaveAnswer = (id: string) => {
    if (!editingAnswer.value.trim()) {
      toast.warning("请输入回答内容");
      return;
    }
    store.answerQuestion(id, editingAnswer.value.trim());
    editingId.value = null;
    editingAnswer.value = "";
  };

  const handleCancelEdit = () => {
    editingId.value = null;
    editingAnswer.value = "";
  };

  const handleDeleteQuestion = async (id: string) => {
    const qa = store.visibleQuestions.find((q: { id: string }) => q.id === id);
    const actionLabel = qa?.answer ? "删除" : "跳过";

    // 简化处理：直接使用 confirm
    if (confirm(`确定要${actionLabel}该问题吗？`)) {
      store.deleteQuestion(id);
    }
  };

  return {
    newQuestion,
    newAnswer,
    editingId,
    editingAnswer,
    showAddDialog,
    handleAddQuestion,
    handleEditAnswer,
    handleSaveAnswer,
    handleCancelEdit,
    handleDeleteQuestion,
  };
}
