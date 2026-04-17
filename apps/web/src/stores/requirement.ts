import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  RequirementResponseDto,
  CreateRequirementDto,
  UpdateRequirementDto,
  CreateUserStoryDto,
  UpdateUserStoryDto,
  UserStoryResponseDto,
  CreateAcceptanceCriteriaDto,
  UpdateAcceptanceCriteriaDto,
} from '@req2task/dto';
import { requirementsApi } from '@/api/requirements';
import type { RequirementListParams } from '@/api/requirements';

export const useRequirementStore = defineStore('requirement', () => {
  const requirementList = ref<RequirementResponseDto[]>([]);
  const currentRequirement = ref<RequirementResponseDto | null>(null);
  const currentUserStories = ref<UserStoryResponseDto[]>([]);
  const loading = ref(false);
  const total = ref(0);

  const fetchRequirementList = async (
    moduleId: string,
    params?: RequirementListParams
  ) => {
    loading.value = true;
    try {
      const { data } = await requirementsApi.getListByModule(moduleId, params);
      requirementList.value = data.items;
      total.value = data.total;
    } finally {
      loading.value = false;
    }
  };

  const fetchRequirementById = async (id: string) => {
    loading.value = true;
    try {
      const { data } = await requirementsApi.getById(id);
      currentRequirement.value = data;
    } finally {
      loading.value = false;
    }
  };

  const createRequirement = async (
    moduleId: string,
    data: CreateRequirementDto
  ) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.create(moduleId, data);
      return result;
    } finally {
      loading.value = false;
    }
  };

  const updateRequirement = async (id: string, data: UpdateRequirementDto) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.update(id, data);
      currentRequirement.value = result;
    } finally {
      loading.value = false;
    }
  };

  const deleteRequirement = async (id: string) => {
    loading.value = true;
    try {
      await requirementsApi.delete(id);
    } finally {
      loading.value = false;
    }
  };

  const fetchUserStories = async (requirementId: string) => {
    loading.value = true;
    try {
      const { data } = await requirementsApi.getUserStories(requirementId);
      currentUserStories.value = data;
    } finally {
      loading.value = false;
    }
  };

  const createUserStory = async (
    requirementId: string,
    data: CreateUserStoryDto
  ) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.createUserStory(
        requirementId,
        data
      );
      return result;
    } finally {
      loading.value = false;
    }
  };

  const updateUserStory = async (id: string, data: UpdateUserStoryDto) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.updateUserStory(id, data);
      return result;
    } finally {
      loading.value = false;
    }
  };

  const deleteUserStory = async (id: string) => {
    loading.value = true;
    try {
      await requirementsApi.deleteUserStory(id);
    } finally {
      loading.value = false;
    }
  };

  const createAcceptanceCriteria = async (
    userStoryId: string,
    data: CreateAcceptanceCriteriaDto
  ) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.createAcceptanceCriteria(
        userStoryId,
        data
      );
      return result;
    } finally {
      loading.value = false;
    }
  };

  const updateAcceptanceCriteria = async (
    id: string,
    data: UpdateAcceptanceCriteriaDto
  ) => {
    loading.value = true;
    try {
      const { data: result } = await requirementsApi.updateAcceptanceCriteria(
        id,
        data
      );
      return result;
    } finally {
      loading.value = false;
    }
  };

  const deleteAcceptanceCriteria = async (id: string) => {
    loading.value = true;
    try {
      await requirementsApi.deleteAcceptanceCriteria(id);
    } finally {
      loading.value = false;
    }
  };

  return {
    requirementList,
    currentRequirement,
    currentUserStories,
    loading,
    total,
    fetchRequirementList,
    fetchRequirementById,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    fetchUserStories,
    createUserStory,
    updateUserStory,
    deleteUserStory,
    createAcceptanceCriteria,
    updateAcceptanceCriteria,
    deleteAcceptanceCriteria,
  };
});
