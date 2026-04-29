<script setup lang="ts">
import { ref, onMounted } from "vue";
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

const props = defineProps<{
  projectId: string;
}>();

const tasks = ref<TaskResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  [TaskStatus.TODO]: { label: "待办", class: "bg-slate-100 text-slate-700" },
  [TaskStatus.IN_PROGRESS]: { label: "进行中", class: "bg-blue-100 text-blue-700" },
  [TaskStatus.IN_REVIEW]: { label: "审核中", class: "bg-amber-100 text-amber-700" },
  [TaskStatus.DONE]: { label: "已完成", class: "bg-emerald-100 text-emerald-700" },
  [TaskStatus.BLOCKED]: { label: "已阻塞", class: "bg-red-100 text-red-700" },
  [TaskStatus.CANCELLED]: { label: "已取消", class: "bg-slate-100 text-slate-600" },
};

const priorityConfig: Record<TaskPriority, { label: string; class: string }> = {
  [TaskPriority.URGENT]: { label: "紧急", class: "bg-red-500 text-white" },
  [TaskPriority.HIGH]: { label: "高", class: "bg-orange-500 text-white" },
  [TaskPriority.MEDIUM]: { label: "中", class: "bg-yellow-500 text-white" },
  [TaskPriority.LOW]: { label: "低", class: "bg-slate-500 text-white" },
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
        <Button size="sm">
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

      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="tasks.length === 0" class="text-center py-12 text-slate-400">
        暂无任务
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <div class="flex items-center gap-3 flex-1">
            <CheckSquare class="w-4 h-4 text-slate-400" />
            <div class="flex-1">
              <p class="font-medium text-slate-800">{{ task.title }}</p>
              <p class="text-xs text-slate-500">{{ task.taskNo }}</p>
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
            <span class="text-xs text-slate-400">{{ task.estimatedHours }}h</span>
            <ChevronRight class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
