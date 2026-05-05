<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { RequirementResponseDto } from "@req2task/dto";
import { RequirementStatus, Priority, RequirementSource } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  ChevronRight,
  RefreshCw,
} from "lucide-vue-next";
import { requirementsApi } from "@/api/requirements";
import CreateRequirementDialog from "@/components/requirements/CreateRequirementDialog.vue";

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const requirements = ref<RequirementResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isRefreshing = ref(false);
const isCreateDialogOpen = ref(false);

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
    error.value = null;
    const response = await requirementsApi.getListByProject(props.projectId, { limit: 20 });
    requirements.value = response.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载需求失败";
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  isRefreshing.value = true;
  await fetchRequirements();
  isRefreshing.value = false;
};

const goToRequirement = (requirementId: string) => {
  router.push(`/projects/${props.projectId}/requirements/${requirementId}`);
};

const openCreateDialog = () => {
  isCreateDialogOpen.value = true;
};

const handleCreateRequirement = async (data: {
  title: string;
  description: string;
  priority: Priority;
  storyPoints: number;
}) => {
  try {
    await requirementsApi.createByProject(props.projectId, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      storyPoints: data.storyPoints,
      source: RequirementSource.MANUAL,
    });
    await fetchRequirements();
  } catch (err) {
    console.error("创建需求失败:", err);
  }
};

onMounted(() => {
  fetchRequirements();
});

defineExpose({
  refresh,
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <FileText class="w-5 h-5" />
          需求列表
          <Badge v-if="requirements.length > 0" variant="secondary" class="text-xs">
            {{ requirements.length }}
          </Badge>
        </CardTitle>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            :disabled="isRefreshing"
            @click="refresh"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </Button>
          <Button size="sm" @click="openCreateDialog">
            <Plus class="w-4 h-4 mr-2" />
            新建需求
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>

      <div v-else-if="requirements.length === 0" class="text-center py-12">
        <FileText class="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p class="text-muted-foreground mb-2">暂无需求</p>
        <p class="text-muted-foreground/60 text-sm mb-4">开始创建项目需求</p>
        <Button size="sm" @click="openCreateDialog">
          <Plus class="w-4 h-4 mr-2" />
          新建需求
        </Button>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="req in requirements"
          :key="req.id"
          class="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          @click="goToRequirement(req.id)"
        >
          <div class="flex items-center gap-3 flex-1">
            <FileText class="w-4 h-4 text-muted-foreground" />
            <div class="flex-1">
              <p class="font-medium text-card-foreground">{{ req.title }}</p>
              <p class="text-xs text-muted-foreground">{{ req.entityKey }}</p>
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
            <span class="text-xs text-muted-foreground">{{ req.storyPoints }} SP</span>
            <ChevronRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <CreateRequirementDialog
    :open="isCreateDialogOpen"
    :project-id="projectId"
    @update:open="isCreateDialogOpen = $event"
    @confirm="handleCreateRequirement"
  />
</template>
