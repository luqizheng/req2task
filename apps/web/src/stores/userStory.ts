import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserStoryResponseDto } from '@req2task/dto';
import { requirementsApi } from '@/api/requirements';
import type { CreateUserStoryDto, UpdateUserStoryDto } from '@req2task/dto';

export const useUserStoryStore = defineStore('userStory', () => {
  const userStories = ref<UserStoryResponseDto[]>([]);
  const currentStory = ref<UserStoryResponseDto | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchByRequirement = async (requirementId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      userStories.value = await requirementsApi.getUserStories(requirementId);
      return userStories.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user stories';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const create = async (requirementId: string, data: CreateUserStoryDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const story = await requirementsApi.createUserStory(requirementId, data);
      userStories.value.push(story);
      return story;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user story';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const update = async (id: string, data: UpdateUserStoryDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const story = await requirementsApi.updateUserStory(id, data);
      const index = userStories.value.findIndex(s => s.id === id);
      if (index !== -1) {
        userStories.value[index] = story;
      }
      if (currentStory.value?.id === id) {
        currentStory.value = story;
      }
      return story;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user story';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const remove = async (id: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await requirementsApi.deleteUserStory(id);
      userStories.value = userStories.value.filter(s => s.id !== id);
      if (currentStory.value?.id === id) {
        currentStory.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user story';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const selectStory = (story: UserStoryResponseDto | null) => {
    currentStory.value = story;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    userStories,
    currentStory,
    isLoading,
    error,
    fetchByRequirement,
    create,
    update,
    remove,
    selectStory,
    clearError,
  };
});
