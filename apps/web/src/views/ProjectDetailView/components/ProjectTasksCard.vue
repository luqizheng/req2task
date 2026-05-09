<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { TaskResponseDto } from "@req2task/dto";
import { TaskStatus } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnumBadge from "@/components/common/EnumBadge.vue";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/utils/enum-config";
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
            <EnumBadge :value="task.priority" :config="TASK_PRIORITY_CONFIG" class="text-xs" />
            <EnumBadge :value="task.status" :config="TASK_STATUS_CONFIG" class="text-xs" />
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
