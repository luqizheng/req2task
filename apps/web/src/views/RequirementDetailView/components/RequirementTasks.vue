<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RequirementResponseDto, TaskResponseDto } from "@req2task/dto";
import { TaskPriority } from "@req2task/dto";
import { tasksApi } from "@/api/tasks";
import { requirementsApi } from "@/api/requirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Check, X } from "lucide-vue-next";
import type { GeneratedTask } from "@/api/ai";
import { useSSEStream } from "@/utils/useSSEStream";
import { toast } from "vue-sonner";
import { useJsonStream } from "json-stream-handler";
const props = defineProps<{
  requirementId: string;
  projectId: string;
}>();

const tasks = ref<TaskResponseDto[]>([]);
const loading = ref(true);
const isGeneratingTasks = ref(false);
const unsavedGeneratedTasks = ref<GeneratedTask[]>([]);
const savingTaskIds = ref(new Set<string>());
const requirement = ref<RequirementResponseDto | null>(null);

const jsonStream = useJsonStream([
  {
    trigger: "*",
    onArrayItem: (item) => {
     
      const task = item as TaskResponseDto;
      tasks.value = [...tasks.value, task as TaskResponseDto];
    },
  },
]);
const sseStream = useSSEStream({
  url: `/api/requirements/${props.requirementId}/ai-generate-tasks?projectId=${props.projectId}`,
});

const fetchTasks = async () => {
  try {
    loading.value = true;
    const [tasksResponse, reqResponse] = await Promise.all([
      tasksApi.getListByRequirement(props.requirementId),
      requirementsApi.getById(props.requirementId),
    ]);
    tasks.value = tasksResponse.items || [];
    requirement.value = reqResponse;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

const handleGenerateTasks = async () => {
  try {
    isGeneratingTasks.value = true;
    unsavedGeneratedTasks.value = [];

    await sseStream.submitStream(
      { featurePoints: requirement.value?.featurePoints },
      {
        onContent: (data) => {
          jsonStream.feed(data || "");
        },
        onDone: (event) => {
          const data = event.extractedData as
            | { tasks?: GeneratedTask[] }
            | undefined;
          if (data?.tasks) {
            unsavedGeneratedTasks.value = data.tasks;
          }
          toast.success(
            `成功生成 ${unsavedGeneratedTasks.value.length} 个任务`,
          );
        },
        onError: (error) => {
          toast.error("生成任务失败", {
            description: error.message || "请稍后重试",
          });
        },
      },
    );
  } catch (error) {
    console.error("Failed to generate tasks:", error);
    toast.error("生成任务失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingTasks.value = false;
  }
};

const handleKeepTask = (task: GeneratedTask) => {
  unsavedGeneratedTasks.value = unsavedGeneratedTasks.value.filter(
    (t) => t.id !== task.id,
  );
  tasks.value = [...tasks.value, task as TaskResponseDto];
};

const handleDeleteTask = async (task: GeneratedTask) => {
  savingTaskIds.value.add(task.id);
  try {
    await tasksApi.delete(task.id);
    unsavedGeneratedTasks.value = unsavedGeneratedTasks.value.filter(
      (t) => t.id !== task.id,
    );
    toast.success("任务已删除");
  } catch (error) {
    console.error("Failed to delete task:", error);
    toast.error("删除任务失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    savingTaskIds.value.delete(task.id);
  }
};

onMounted(() => {
  fetchTasks();
});

defineExpose({
  reload: () => {
    fetchTasks();
  },
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg flex items-center gap-2">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          关联任务 ({{ tasks.length + unsavedGeneratedTasks.length }})
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          class="gap-2"
          :disabled="isGeneratingTasks"
          @click="handleGenerateTasks"
        >
          <Loader2 v-if="isGeneratingTasks" class="w-4 h-4 animate-spin" />
          <Sparkles v-else class="w-4 h-4" />
          {{ isGeneratingTasks ? "生成中..." : "AI 生成" }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="p-3 border rounded-lg">
          <div class="space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <template v-else>
        <div v-if="unsavedGeneratedTasks.length > 0" class="space-y-3 mb-4">
          <div
            v-for="task in unsavedGeneratedTasks"
            :key="task.id"
            class="p-3 border-2 border-dashed rounded-lg"
            :class="cn('bg-accent', 'border-accent-foreground')"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-mono text-muted-foreground">{{
                    task.taskNo
                  }}</span>
                  <Badge
                    variant="outline"
                    class="text-xs text-accent-foreground"
                    :class="cn('border-accent-foreground')"
                  >
                    新生成
                  </Badge>
                  <Badge variant="outline" class="text-xs">
                    {{ task.status }}
                  </Badge>
                </div>
                <p class="text-sm font-medium text-foreground">
                  {{ task.title }}
                </p>
                <p
                  v-if="task.description"
                  class="text-xs mt-1 text-muted-foreground"
                >
                  {{ task.description }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Badge
                  :class="
                    cn(
                      'text-xs',
                      task.priority === TaskPriority.URGENT
                        ? 'bg-destructive/15 text-destructive'
                        : task.priority === TaskPriority.HIGH
                          ? 'bg-primary/15 text-primary'
                          : task.priority === TaskPriority.MEDIUM
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground',
                    )
                  "
                >
                  {{ task.priority }}
                </Badge>
                <span
                  v-if="task.estimatedHours"
                  class="text-xs text-muted-foreground"
                >
                  {{ task.estimatedHours }}h
                </span>
              </div>
            </div>
            <div
              class="flex justify-end gap-2 mt-3 pt-2 border-t border-border"
            >
              <Button
                size="sm"
                variant="outline"
                class="gap-1"
                :disabled="savingTaskIds.has(task.id)"
                @click="handleDeleteTask(task)"
              >
                <X class="w-3 h-3" />
                删除
              </Button>
              <Button
                size="sm"
                class="gap-1"
                :disabled="savingTaskIds.has(task.id)"
                @click="handleKeepTask(task)"
              >
                <Check class="w-3 h-3" />
                保留
              </Button>
            </div>
          </div>
        </div>

        <div v-if="tasks.length > 0" class="space-y-3">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-mono text-muted-foreground">{{
                    task.taskNo
                  }}</span>
                  <Badge variant="outline" class="text-xs">
                    {{ task.status }}
                  </Badge>
                </div>
                <p class="text-sm font-medium text-foreground">
                  {{ task.title }}
                </p>
                <p
                  v-if="task.description"
                  class="text-xs text-muted-foreground mt-1"
                >
                  {{ task.description }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Badge
                  :class="
                    cn(
                      'text-xs',
                      task.priority === TaskPriority.URGENT
                        ? 'bg-destructive/15 text-destructive'
                        : task.priority === TaskPriority.HIGH
                          ? 'bg-primary/15 text-primary'
                          : task.priority === TaskPriority.MEDIUM
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-muted-foreground',
                    )
                  "
                >
                  {{ task.priority }}
                </Badge>
                <span
                  v-if="task.estimatedHours"
                  class="text-xs text-muted-foreground"
                >
                  {{ task.estimatedHours }}h
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="tasks.length === 0 && unsavedGeneratedTasks.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <svg
            class="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <p class="text-sm">暂无关联任务</p>
          <p class="text-xs mt-1">点击上方"AI 生成"按钮创建任务</p>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
