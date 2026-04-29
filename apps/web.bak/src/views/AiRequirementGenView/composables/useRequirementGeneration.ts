import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { aiApi } from '@/api/ai';
import { useAiStore } from '@/stores/ai';
import type { GenerateRequirementResponse } from '@/api/ai';
import type { EditableRequirement, GenerationStep } from './useGenerationSteps';
import { syncFromResponse } from './useGenerationSteps';

export function useRequirementGeneration(
  editableRequirement: ReturnType<typeof reactive<EditableRequirement>>,
  generatedRequirement: ReturnType<typeof ref<GenerateRequirementResponse | null>>,
  updateStepStatus: (key: string, status: GenerationStep['status']) => void,
  resetSteps: () => void
) {
  const aiStore = useAiStore();
  const isLoading = ref(false);

  const generateAll = async (rawInput: string) => {
    if (!rawInput.trim()) {
      ElMessage.warning('请输入原始需求描述');
      return;
    }

    isLoading.value = true;
    try {
      updateStepStatus('requirement', 'generating');
      const result = await aiApi.generateRequirement(
        rawInput,
        aiStore.getActiveConfigId()
      );
      generatedRequirement.value = result;
      syncFromResponse(editableRequirement, result);
      updateStepStatus('requirement', 'completed');
      updateStepStatus('userStory', 'completed');
      updateStepStatus('criteria', 'completed');
      ElMessage.success('需求生成完成');
    } catch (error) {
      updateStepStatus('requirement', 'failed');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const regenerateUserStories = async () => {
    if (!editableRequirement.description) {
      ElMessage.warning('请先生成需求');
      return;
    }

    isLoading.value = true;
    try {
      updateStepStatus('userStory', 'generating');
      const content = `${editableRequirement.title}\n${editableRequirement.description}`;
      editableRequirement.userStories = await aiApi.generateUserStories(
        content,
        aiStore.getActiveConfigId()
      );
      updateStepStatus('userStory', 'completed');
      ElMessage.success('用户故事重新生成完成');
    } catch (error) {
      updateStepStatus('userStory', 'failed');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const regenerateCriteria = async () => {
    if (!editableRequirement.description) {
      ElMessage.warning('请先生成需求');
      return;
    }

    isLoading.value = true;
    try {
      updateStepStatus('criteria', 'generating');
      const content = `${editableRequirement.title}\n${editableRequirement.description}`;
      editableRequirement.acceptanceCriteria = await aiApi.generateAcceptanceCriteria(
        content,
        aiStore.getActiveConfigId()
      );
      updateStepStatus('criteria', 'completed');
      ElMessage.success('验收条件重新生成完成');
    } catch (error) {
      updateStepStatus('criteria', 'failed');
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const handleClear = (rawInputRef: { value: string }) => {
    rawInputRef.value = '';
    generatedRequirement.value = null;
    resetSteps();
  };

  return {
    isLoading,
    generateAll,
    regenerateUserStories,
    regenerateCriteria,
    handleClear,
  };
}
