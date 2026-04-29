<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { RequirementStatus, Priority } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  ChevronRight,
} from "lucide-vue-next";
import api from "@/api/axios";

const props = defineProps<{
  projectId: string;
}>();

const requirements = ref<RequirementResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const statusConfig: Record<RequirementStatus, { label: string; class: string }> = {
  [RequirementStatus.DRAFT]: { label: "草稿", class: "bg-slate-100 text-slate-700" },
  [RequirementStatus.REVIEWED]: { label: "已审核", class: "bg-blue-100 text-blue-700" },
  [RequirementStatus.APPROVED]: { label: "已批准", class: "bg-emerald-100 text-emerald-700" },
  [RequirementStatus.REJECTED]: { label: "已拒绝", class: "bg-red-100 text-red-700" },
  [RequirementStatus.PROCESSING]: { label: "进行中", class: "bg-indigo-100 text-indigo-700" },
  [RequirementStatus.COMPLETED]: { label: "已完成", class: "bg-purple-100 text-purple-700" },
  [RequirementStatus.CANCELLED]: { label: "已取消", class: "bg-slate-100 text-slate-600" },
};

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  [Priority.CRITICAL]: { label: "关键", class: "bg-red-500 text-white" },
  [Priority.HIGH]: { label: "高", class: "bg-orange-500 text-white" },
  [Priority.MEDIUM]: { label: "中", class: "bg-yellow-500 text-white" },
  [Priority.LOW]: { label: "低", class: "bg-slate-500 text-white" },
};

const fetchRequirements = async () => {
  try {
    loading.value = true;
    const response = await api.get<{ items: RequirementResponseDto[] }>(`/projects/${props.projectId}/requirements`);
    requirements.value = response.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载需求失败";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRequirements();
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <FileText class="w-5 h-5" />
          需求列表
        </CardTitle>
        <Button size="sm">
          <Plus class="w-4 h-4 mr-2" />
          新建需求
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="requirements.length === 0" class="text-center py-12 text-slate-400">
        暂无需求
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="req in requirements"
          :key="req.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <div class="flex items-center gap-3 flex-1">
            <FileText class="w-4 h-4 text-slate-400" />
            <div class="flex-1">
              <p class="font-medium text-slate-800">{{ req.title }}</p>
              <p class="text-xs text-slate-500">{{ req.entityKey }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              :class="priorityConfig[req.priority]?.class"
              class="text-xs"
            >
              {{ priorityConfig[req.priority]?.label || req.priority }}
            </Badge>
            <Badge
              :class="statusConfig[req.status]?.class"
              class="text-xs"
            >
              {{ statusConfig[req.status]?.label || req.status }}
            </Badge>
            <span class="text-xs text-slate-400">{{ req.storyPoints }} SP</span>
            <ChevronRight class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
