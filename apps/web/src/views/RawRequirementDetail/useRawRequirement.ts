import { ref, onMounted } from 'vue';
import { rawRequirementsApi, type RawRequirementResponseDto } from '@/api/rawRequirements';

export const useRawRequirement = (id: string) => {
  const rawRequirement = ref<RawRequirementResponseDto | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchRawRequirement = async () => {
    if (!id) {
      loading.value = false;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await rawRequirementsApi.getRawRequirement(id);
      rawRequirement.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载需求失败';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchRawRequirement();
  });

  return {
    rawRequirement,
    loading,
    error,
    fetchRawRequirement
  };
};