<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { RequirementResponseDto, TaskResponseDto } from "@req2task/dto";
import { TaskPriority } from "@req2task/dto";
import { tasksApi } from "@/api/tasks";
import { requirementsApi } from "@/api/requirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, CheckSquare } from "lucide-vue-next";
import { useSSEStream } from "@/utils/useSSEStream";
import { toast } from "vue-sonner";
import { useJsonStream } from "json-stream-handler";
import CommonCard from "@/components/CommonCard.vue";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useListEdit from "@/composables/useListEdit";
import { PrioritySelect, PriorityBadge } from "@/components/common";

const props = defineProps<{
  requirementId: string;
  projectId: string;
}>();

const {
  list: tasks,
  removeIndex,
  setEditing,
  cancelEditing,
  isEditing,
} = useListEdit<TaskResponseDto>([], {
  isPersist: (item) => !!item.id,
  onDelete: async (item) => {
    await tasksApi.delete(item.id);
    toast.success("删除成功");
  },
  onEdited: async (item) => {
    await saveTask(item);
  },
});

const loading = ref(true);
const isGeneratingTasks = ref(false);
const unsavedTasks = computed(() => tasks.value.filter((task) => !task.id));
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
  url: `/api/requirements/${props.requirementId}/ai-generate-tasks-preview?projectId=${props.projectId}`,
});

const fetchTasks = async () => {
  try {
    loading.value = true;
    const [tasksResponse, reqResponse] = await Promise.all([
      tasksApi.getListByRequirement(props.requirementId),
      requirementsApi.getById(props.requirementId),
    ]);
    tasks.value = tasksResponse.items;
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

    await sseStream.submitStream(
      { featurePoints: requirement.value?.featurePoints },
      {
        onContent: (data) => {
          jsonStream.feed(data || "");
        },
        onDone: (_event) => {
          toast.success(`成功生成 ${tasks.value.length} 个任务`);
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

const saveTask = async (task: TaskResponseDto) => {
  try {
    if (task.id) {
      await tasksApi.update(task.id, {
        title: task.title,
        description: task.description || undefined,
        priority: task.priority as TaskPriority,
        estimatedHours: task.estimatedHours || undefined,
      });
    } else {
      const created = await tasksApi.create(
        props.requirementId,
        {
          title: task.title,
          description: task.description || undefined,
          priority: task.priority as TaskPriority,
          estimatedHours: task.estimatedHours || undefined,
        },
        props.projectId,
      );
      tasks.value = [...tasks.value, created];
    }
    toast.success("任务已保存");
  } catch (error) {
    console.error("Failed to save task:", error);
    toast.error("保存任务失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
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
          <CheckSquare class="w-5 h-5" />
          关联任务 ({{ tasks.length }})
          <Badge
            v-if="unsavedTasks.length > 0"
            variant="secondary"
            class="ml-2"
          >
            {{ unsavedTasks.length }} 未保存
          </Badge>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          class="gap-2"
          :disabled="isGeneratingTasks || !requirement?.featurePoints"
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
        <CommonCard
          v-for="(task, index) in tasks"
          :key="task.taskNo"
          class="mb-3"
        >
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1">
                <div v-if="!isEditing(index)" class="font-medium">
                  {{ task.title }}
                </div>
                <Input
                  v-else
                  v-model="task.title"
                  class="w-full"
                  placeholder="任务标题"
                />
              </div>
              <PriorityBadge
                v-if="task.priority"
                :priority="task.priority"
              />
            </div>
          </template>

          <div class="space-y-3">
            <div v-if="!isEditing(index)" class="text-sm text-muted-foreground">
              {{ task.description || '暂无描述' }}
            </div>
            <Textarea
              v-else
              v-model="task.description"
              class="w-full min-h-[60px]"
              placeholder="任务描述"
            />
            <div v-if="!isEditing(index) && task.estimatedHours" class="text-xs text-muted-foreground">
              预估工时: {{ task.estimatedHours }}h
            </div>
            <div v-if="isEditing(index)" class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">优先级:</span>
                <PrioritySelect v-model="task.priority" />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">工时:</span>
                <Input
                  v-model.number="task.estimatedHours"
                  type="number"
                  class="w-20 h-7 text-xs"
                  placeholder="小时"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center gap-2 pt-2 border-t mt-3">
              <template v-if="isEditing(index)">
                <Button variant="default" size="sm" @click="saveTask(task)">
                  保存
                </Button>
                <Button variant="outline" size="sm" @click="cancelEditing()">
                  取消
                </Button>
              </template>
              <template v-else>
                <Button variant="outline" size="sm" @click="setEditing(index)">
                  编辑
                </Button>
                <Button
                  v-if="!task.id"
                  variant="secondary"
                  size="sm"
                  @click="saveTask(task)"
                >
                  保存
                </Button>
              </template>
              <Button variant="destructive" size="sm" @click="removeIndex(index)">
                删除
              </Button>
            </div>
          </template>
        </CommonCard>

        <!-- <div v-if="tasks.length > 0" class="space-y-3">
          <div
            v-for="(task, index) in tasks"
            :key="task.taskNo"
            :class="
              cn(
                'p-3 border rounded-lg',
                isEditing(index) && 'bg-accent/5 border-primary/50',
              )
            "
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
                <template v-if="isEditing(index)">
                  <Input
                    v-model="task.title"
                    class="mb-2"
                    placeholder="任务标题"
                  />
                  <Textarea
                    v-model="task.description"
                    class="mb-2 text-xs"
                    placeholder="任务描述"
                    rows="2"
                  />
                </template>
                <template v-else>
                  <p class="text-sm font-medium text-foreground">
                    {{ task.title }}
                  </p>
                  <p
                    v-if="task.description"
                    class="text-xs text-muted-foreground mt-1"
                  >
                    {{ task.description }}
                  </p>
                </template>
              </div>
              <div class="flex items-start gap-2">
                <template v-if="isEditing(index)">
                  <div class="flex flex-col gap-1">
                    <Badge
                      :class="
                        cn(
                          'text-xs cursor-pointer hover:opacity-80',
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
                    <Input
                      v-model.number="task.estimatedHours"
                      type="number"
                      class="w-16 h-6 text-xs"
                      placeholder="小时"
                    />
                  </div>
                </template>
                <template v-else>
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
                    <Button
                      v-if="!task.id"
                      variant="default"
                      size="sm"
                      class="h-7 text-xs"
                      @click="saveTask({ ...task})"
                    >
                      保存
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="h-7 text-xs"
                      @click="setEditing(index)"
                    >
                      编辑
                    </Button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div> -->

        <div
          v-if="tasks.length === 0 && unsavedTasks.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          <CheckSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">暂无关联任务</p>
          <p class="text-xs mt-1">点击上方"AI 生成"按钮创建任务</p>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
