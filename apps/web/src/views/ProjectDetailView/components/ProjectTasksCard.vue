<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { TaskResponseDto } from "@req2task/dto";
import { TaskStatus, TaskPriority } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckSquare,
  Plus,
  ChevronRight,
} from "lucide-vue-next";
import api from "@/api/axios";
import { getInitials } from "@/lib/utils";

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const tasks = ref<TaskResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  [TaskStatus.TODO]: { label: "待办", class: "bg-status-draft/10 text-status-draft" },
  [TaskStatus.IN_PROGRESS]: { label: "进行中", class: "bg-status-processing/10 text-status-processing" },
  [TaskStatus.IN_REVIEW]: { label: "审核中", class: "bg-status-reviewed/10 text-status-reviewed" },
  [TaskStatus.DONE]: { label: "已完成", class: "bg-status-completed/10 text-status-completed" },
  [TaskStatus.BLOCKED]: { label: "已阻塞", class: "bg-status-rejected/10 text-status-rejected" },
  [TaskStatus.CANCELLED]: { label: "已取消", class: "bg-status-cancelled/10 text-status-cancelled" },
};

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  [TaskPriority.URGENT]: { label: "紧急", class: "bg-priority-critical text-white" },
  [TaskPriority.HIGH]: { label: "高", class: "bg-priority-high text-white" },
  [TaskPriority.MEDIUM]: { label: "中", class: "bg-priority-medium text-white" },
  [TaskPriority.LOW]: { label: "低", class: "bg-priority-low text-white" },
};

const fetchTasks = async () => {
  try {
    loading.value = true;
    const response = await api.get<{ items: TaskResponseDto[] }>(`/projects/${props.projectId}/tasks`);
    tasks.value = response.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载任务失败";
  } finally {
    loading.value = false;
  }
};

const goToTask = (taskId: string) => {
  router.push(`/projects/${props.projectId}/tasks/${taskId}`);
};

const goToCreateTask = () => {
  router.push(`/projects/${props.projectId}/tasks/new`);
};

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <CheckSquare class="w-5 h-5" />
          任务列表
        </CardTitle>
        <Button size="sm" @click="goToCreateTask">
          <Plus class="w-4 h-4 mr-2" />
          新建任务
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-16 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8 text-destructive">
        {{ error }}
      </div>

      <div v-else-if="tasks.length === 0" class="text-center py-12 text-muted-foreground">
        暂无任务
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
          @click="goToTask(task.id)"
        >
          <div class="flex items-center gap-3 flex-1">
            <CheckSquare
              :class="[
                'w-4 h-4 transition-colors',
                task.status === TaskStatus.DONE ? 'text-primary' : 'text-muted-foreground'
              ]"
            />
            <div class="flex-1">
              <p class="font-medium text-foreground">{{ task.title }}</p>
              <p class="text-xs text-muted-foreground">{{ task.taskNo }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge
              :class="priorityConfig[task.priority]?.class"
              class="text-xs"
            >
              {{ priorityConfig[task.priority]?.label || task.priority }}
            </Badge>
            <Badge
              :class="statusConfig[task.status]?.class"
              class="text-xs"
            >
              {{ statusConfig[task.status]?.label || task.status }}
            </Badge>
            <Avatar v-if="task.assignedTo" class="w-6 h-6">
              <AvatarFallback class="text-xs">
                {{ getInitials(task.assignedTo.displayName) }}
              </AvatarFallback>
            </Avatar>
            <span class="text-xs text-muted-foreground">{{ task.estimatedHours }}h</span>
            <ChevronRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
