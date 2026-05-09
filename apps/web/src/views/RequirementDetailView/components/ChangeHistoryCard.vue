<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RequirementResponseDto, RequirementStatus } from "@req2task/dto";
import type { ChangeLogItem } from "@/api/requirements";
import { requirementsApi } from "@/api/requirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, User, ArrowRight, FileText } from "lucide-vue-next";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { REQUIREMENT_STATUS_CONFIG, getEnumLabel } from "@/utils/enum-config";

const props = defineProps<{
  requirement: RequirementResponseDto;
}>();

const changeHistory = ref<ChangeLogItem[]>([]);
const loading = ref(true);

const fetchChangeHistory = async () => {
  try {
    loading.value = true;
    const response = await requirementsApi.getChangeHistory(props.requirement.id);
    changeHistory.value = response.logs || [];
  } catch (error) {
    console.error("Failed to fetch change history:", error);
    changeHistory.value = [];
  } finally {
    loading.value = false;
  }
};

const getChangeTypeLabel = (changeType: string) => {
  const labels: Record<string, string> = {
    title: "标题变更",
    description: "描述变更",
    status: "状态变更",
    priority: "优先级变更",
    storyPoints: "故事点变更",
    module: "模块变更",
    creation: "创建",
  };
  return labels[changeType] || changeType;
};

const getChangeTypeColor = (changeType: string) => {
  const colors: Record<string, string> = {
    title: "bg-blue-100 text-blue-700 border-blue-300",
    description: "bg-green-100 text-green-700 border-green-300",
    status: "bg-purple-100 text-purple-700 border-purple-300",
    priority: "bg-orange-100 text-orange-700 border-orange-300",
    storyPoints: "bg-indigo-100 text-indigo-700 border-indigo-300",
    module: "bg-teal-100 text-teal-700 border-teal-300",
    creation: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };
  return colors[changeType] || "bg-slate-100 text-slate-700 border-slate-300";
};

const getStatusLabel = (status: string | null) => {
  if (!status) return "";
  return getEnumLabel(REQUIREMENT_STATUS_CONFIG, status as RequirementStatus);
};

const formatValue = (value: string | null, changeType: string) => {
  if (!value) return "空";
  if (changeType === "status") {
    return getStatusLabel(value);
  }
  return value;
};

onMounted(() => {
  fetchChangeHistory();
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg flex items-center gap-2">
        <History class="w-5 h-5" />
        变更历史
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="flex items-start gap-3">
          <Skeleton class="w-8 h-8 rounded-full" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div v-else-if="changeHistory.length > 0" class="space-y-4">
        <div
          v-for="(log, index) in changeHistory"
          :key="log.id"
          class="relative"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <FileText class="w-4 h-4 text-slate-500" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                  :class="getChangeTypeColor(log.changeType)"
                >
                  {{ getChangeTypeLabel(log.changeType) }}
                </span>
                <span class="text-xs text-slate-500 flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ log.changedBy?.displayName || "未知用户" }}
                </span>
              </div>

              <div class="text-sm space-y-1">
                <div v-if="log.oldValue !== null || log.newValue !== null">
                  <div v-if="log.changeType === 'status'" class="flex items-center gap-2">
                    <span class="text-slate-600">
                      {{ getStatusLabel(log.fromStatus) }}
                    </span>
                    <ArrowRight class="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span class="font-medium text-slate-800">
                      {{ getStatusLabel(log.toStatus) }}
                    </span>
                  </div>
                  <div v-else class="flex items-start gap-2">
                    <span
                      v-if="log.oldValue !== null"
                      class="text-slate-500 line-through"
                    >
                      {{ formatValue(log.oldValue, log.changeType) }}
                    </span>
                    <ArrowRight
                      v-if="log.oldValue !== null && log.newValue !== null"
                      class="w-3 h-3 text-slate-400 flex-shrink-0 mt-1"
                    />
                    <span
                      v-if="log.newValue !== null"
                      class="text-slate-800 font-medium"
                    >
                      {{ formatValue(log.newValue, log.changeType) }}
                    </span>
                  </div>
                </div>

                <p v-if="log.comment" class="text-slate-600 italic mt-1">
                  "{{ log.comment }}"
                </p>

                <p class="text-xs text-slate-400 mt-2">
                  {{ formatDateTime(new Date(log.createdAt)) }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="index < changeHistory.length - 1"
            class="absolute left-4 top-10 w-px h-4 bg-slate-200"
          />
        </div>
      </div>

      <div v-else class="text-center py-8 text-slate-400">
        <History class="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p class="text-sm">暂无变更历史</p>
      </div>
    </CardContent>
  </Card>
</template>
