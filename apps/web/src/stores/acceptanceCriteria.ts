import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AcceptanceCriteriaResponseDto } from '@req2task/dto';
import { requirementsApi } from '@/api/requirements';
import type { CreateAcceptanceCriteriaDto, UpdateAcceptanceCriteriaDto } from '@req2task/dto';

export const useAcceptanceCriteriaStore = defineStore('acceptanceCriteria', () => {
  const criteriaList = ref<AcceptanceCriteriaResponseDto[]>([]);
  const currentCriteria = ref<AcceptanceCriteriaResponseDto | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchByUserStory = async (userStoryId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      criteriaList.value = await requirementsApi.getAcceptanceCriteria(userStoryId);
      return criteriaList.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch acceptance criteria';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const create = async (userStoryId: string, data: CreateAcceptanceCriteriaDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const criteria = await requirementsApi.createAcceptanceCriteria(userStoryId, data);
      criteriaList.value.push(criteria);
      return criteria;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create acceptance criteria';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const update = async (id: string, data: UpdateAcceptanceCriteriaDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const criteria = await requirementsApi.updateAcceptanceCriteria(id, data);
      const index = criteriaList.value.findIndex(c => c.id === id);
      if (index !== -1) {
        criteriaList.value[index] = criteria;
      }
      if (currentCriteria.value?.id === id) {
        currentCriteria.value = criteria;
      }
      return criteria;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update acceptance criteria';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const remove = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await requirementsApi.deleteAcceptanceCriteria(id);
      criteriaList.value = criteriaList.value.filter(c => c.id !== id);
      if (currentCriteria.value?.id === id) {
        currentCriteria.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete acceptance criteria';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectCriteria = (criteria: AcceptanceCriteriaResponseDto | null) => {
    currentCriteria.value = criteria;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    criteriaList,
    currentCriteria,
    isLoading,
    error,
    fetchByUserStory,
    create,
    update,
    remove,
    selectCriteria,
    clearError,
  };
});
