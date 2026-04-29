import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  rawRequirementsApi,
  RawRequirementStatus,
} from "@/api/rawRequirements";
import type {
  RawRequirementResponseDto,
  RawRequirementListParams,
} from "@/api/rawRequirements";

export const useRawRequirementList = () => {
  const route = useRoute();

  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const statusFilter = ref<RawRequirementStatus | undefined>(undefined);
  const requirements = ref<RawRequirementResponseDto[]>([]);

  const projectId = computed(() => route.params.id as string);

  const loadRequirements = async () => {
    loading.value = true;
    try {
      const params: RawRequirementListParams = {
        page: currentPage.value,
        limit: pageSize.value,
        status: statusFilter.value,
      };
      const result = await rawRequirementsApi.getByProject(
        projectId.value,
        params,
      );
      requirements.value = Array.isArray(result) ? result : [];
      total.value = Array.isArray(result) ? result.length : 0;
    } catch (error) {
      ElMessage.error((error as Error).message || "加载原始需求列表失败");
      requirements.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  };

  const handleFilter = () => {
    currentPage.value = 1;
    loadRequirements();
  };

  const handleReset = () => {
    statusFilter.value = undefined;
    currentPage.value = 1;
    loadRequirements();
  };

  const handlePageChange = (page: number) => {
    currentPage.value = page;
    loadRequirements();
  };

  const handleSizeChange = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
    loadRequirements();
  };

  onMounted(() => {
    loadRequirements();
  });

  return {
    loading,
    total,
    currentPage,
    pageSize,
    statusFilter,
    requirements,
    projectId,
    handleFilter,
    handleReset,
    handlePageChange,
    handleSizeChange,
  };
};
