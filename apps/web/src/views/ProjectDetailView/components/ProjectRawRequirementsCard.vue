<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { RawRequirementStatus } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileQuestion,
  Plus,
  ChevronRight,
} from "lucide-vue-next";
import api from "@/api/axios";

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const rawRequirements = ref<RawRequirementResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const statusConfig: Record<RawRequirementStatus, { label: string; class: string }> = {
  [RawRequirementStatus.PENDING]: { label: "待处理", class: "bg-slate-100 text-slate-700" },
  [RawRequirementStatus.PROCESSING]: { label: "处理中", class: "bg-blue-100 text-blue-700" },
  [RawRequirementStatus.COMPLETED]: { label: "已完成", class: "bg-emerald-100 text-emerald-700" },
  [RawRequirementStatus.CLARIFIED]: { label: "已澄清", class: "bg-indigo-100 text-indigo-700" },
  [RawRequirementStatus.CONVERTED]: { label: "已转换", class: "bg-purple-100 text-purple-700" },
  [RawRequirementStatus.DISCARDED]: { label: "已废弃", class: "bg-red-100 text-red-700" },
  [RawRequirementStatus.FAILED]: { label: "失败", class: "bg-red-100 text-red-700" },
};

const fetchRawRequirements = async () => {
  try {
    loading.value = true;
    const response = await api.get<{ items: RawRequirementResponseDto[] }>(`/projects/${props.projectId}/raw-requirements`);
    rawRequirements.value = response.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载原始需求失败";
  } finally {
    loading.value = false;
  }
};

const goToRawRequirement = (rawRequirementId: string) => {
  router.push(`/projects/${props.projectId}/raw-requirements/${rawRequirementId}`);
};

onMounted(() => {
  fetchRawRequirements();
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <FileQuestion class="w-5 h-5" />
          原始需求
        </CardTitle>
        <Button size="sm">
          <Plus class="w-4 h-4 mr-2" />
          收集需求
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-20 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="rawRequirements.length === 0" class="text-center py-12 text-slate-400">
        暂无原始需求
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="raw in rawRequirements"
          :key="raw.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          @click="goToRawRequirement(raw.id)"
        >
          <div class="flex items-center gap-3 flex-1">
            <FileQuestion class="w-4 h-4 text-slate-400" />
            <div class="flex-1">
              <p class="font-medium text-slate-800">
                {{ raw.title || "未命名需求" }}
              </p>
              <p class="text-xs text-slate-500 mt-1 line-clamp-1">
                {{ raw.content }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              :class="statusConfig[raw.status]?.class"
              class="text-xs"
            >
              {{ statusConfig[raw.status]?.label || raw.status }}
            </Badge>
            <span class="text-xs text-slate-400">
              {{ raw.questionAndAnswers?.length || 0 }} Q&A
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
