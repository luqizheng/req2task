import { ref, onMounted, computed } from "vue";
import dayjs from "dayjs";

import {
  rawRequirementsApi,
  type RawRequirementResponseDto,
} from "@/api/rawRequirements";
import { useRoute } from "vue-router";

export const useRawRequirement = () => {
  const router = useRoute();
  const rawRequirementId = router.params.rawRequirementId as string;
  const rawRequirement = ref<RawRequirementResponseDto | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const infoItems = computed<{ title: string; content: string }[]>(() => {
    if (!rawRequirement.value) {
      return [];
    }
    return [
      {
        title: "来源",
        content: rawRequirement.value.source || "-",
      },
      {
        title: "收集类型",
        content: rawRequirement.value.collectionType || "-",
      },
      {
        title: "收集时间",
        content: dayjs(rawRequirement.value.collectTime).format("YYYY-M-D"),
      },
      {
        title: "状态",
        content: rawRequirement.value.status || "-",
      },
      {
        title: "创建时间",
        content: dayjs(rawRequirement.value.createdAt).format("YYYY-M-D"),
      },
    ];
  });

  const fetchRawRequirement = async () => {
    if (!rawRequirementId) {
      loading.value = false;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await rawRequirementsApi.getRawRequirement(rawRequirementId);

      rawRequirement.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "加载需求失败";
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
    infoItems,
    fetchRawRequirement,
  };
};
