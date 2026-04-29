import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import type { GenerateRequirementResponse } from '@/api/ai';
import type { EditableRequirement } from './useGenerationSteps';
import { syncFromResponse } from './useGenerationSteps';

export function useRequirementEditor(
  editableRequirement: ReturnType<typeof reactive<EditableRequirement>>,
  generatedRequirement: ReturnType<typeof ref<GenerateRequirementResponse | null>>
) {
  const isEditing = ref(false);

  const handleEdit = () => {
    isEditing.value = true;
  };

  const handleCancelEdit = () => {
    if (generatedRequirement.value) {
      syncFromResponse(editableRequirement, generatedRequirement.value);
    }
    isEditing.value = false;
  };

  const handleSave = () => {
    generatedRequirement.value = {
      id: generatedRequirement.value?.id || '',
      title: editableRequirement.title,
      description: editableRequirement.description,
      priority: editableRequirement.priority,
      userStories: editableRequirement.userStories,
      acceptanceCriteria: editableRequirement.acceptanceCriteria,
    };
    isEditing.value = false;
    ElMessage.success('保存成功');
  };

  return {
    isEditing,
    handleEdit,
    handleCancelEdit,
    handleSave,
  };
}

export function useUserStoryEditor(
  editableRequirement: ReturnType<typeof reactive<EditableRequirement>>
) {
  const handleAddUserStory = () => {
    editableRequirement.userStories.push({
      role: '',
      goal: '',
      benefit: '',
    });
  };

  const handleRemoveUserStory = (index: number) => {
    editableRequirement.userStories.splice(index, 1);
  };

  return {
    handleAddUserStory,
    handleRemoveUserStory,
  };
}

export function useCriteriaEditor(
  editableRequirement: ReturnType<typeof reactive<EditableRequirement>>
) {
  const handleAddCriteria = () => {
    editableRequirement.acceptanceCriteria.push('');
  };

  const handleRemoveCriteria = (index: number) => {
    editableRequirement.acceptanceCriteria.splice(index, 1);
  };

  return {
    handleAddCriteria,
    handleRemoveCriteria,
  };
}
