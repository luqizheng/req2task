<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { RequirementResponseDto, TaskResponseDto } from "@req2task/dto";
import { TaskPriority } from "@req2task/dto";
import { tasksApi } from "@/api/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-vue-next";
import { aiApi } from "@/api/ai";
import { toast } from "vue-sonner";

const props = defineProps<{
  requirement: RequirementResponseDto;
  requirementId: string;
  projectId: string;
  refreshKey?: number;
}>();

const tasks = ref<TaskResponseDto[]>([]);
const loading = ref(true);
const showTaskDialog = ref(false);
const isGeneratingTasks = ref(false);
const taskFeaturePoints = ref("");
const taskContext = ref("");

const fetchTasks = async () => {
  try {
    loading.value = true;
    const response = await tasksApi.getListByRequirement(props.requirementId);
    tasks.value = response.items || [];
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    tasks.value = [];
  } finally {
    loading.value = false;
  }
};

const handleGenerateTasks = async () => {
  const featurePoints = taskFeaturePoints.value.trim() || props.requirement.featurePoints;

  if (!featurePoints) {
    toast.error("功能点为空，请先生成功能点或手动输入");
    return;
  }

  try {
    isGeneratingTasks.value = true;
    const response = await aiApi.generateTasksForRequirement(
      props.requirementId,
      props.projectId,
      featurePoints,
      taskContext.value || undefined
    );
    
    toast.success(`成功生成 ${response.tasks.length} 个任务`);
    await fetchTasks();
    showTaskDialog.value = false;
    taskFeaturePoints.value = "";
    taskContext.value = "";
  } catch (error) {
    console.error("Failed to generate tasks:", error);
    toast.error("生成任务失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGeneratingTasks.value = false;
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
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          关联任务 ({{ tasks.length }})
        </CardTitle>
        <Dialog v-model:open="showTaskDialog">
          <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="gap-2">
              <Sparkles class="w-4 h-4" />
              AI 生成
            </Button>
          </DialogTrigger>
          <DialogContent class="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI 生成任务</DialogTitle>
              <DialogDescription>
                描述功能点，AI 将自动拆解任务并估算工时
              </DialogDescription>
            </DialogHeader>
            <div class="space-y-4 py-4">
              <div class="space-y-2">
                <Label for="task-feature-points">功能点描述 <span class="text-red-500">*</span></Label>
                <Textarea
                  id="task-feature-points"
                  v-model="taskFeaturePoints"
                  placeholder="请描述需要实现的功能点，例如：用户登录功能..."
                  class="min-h-[100px]"
                />
              </div>
              <div class="space-y-2">
                <Label for="task-context">附加上下文（可选）</Label>
                <Input
                  id="task-context"
                  v-model="taskContext"
                  placeholder="补充技术栈、约束条件等"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                :disabled="isGeneratingTasks"
                @click="showTaskDialog = false"
              >
                取消
              </Button>
              <Button
                :disabled="isGeneratingTasks || !taskFeaturePoints.trim()"
                @click="handleGenerateTasks"
              >
                <Loader2 v-if="isGeneratingTasks" class="w-4 h-4 mr-2 animate-spin" />
                {{ isGeneratingTasks ? '生成中...' : '生成任务' }}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      <div v-else-if="tasks.length > 0" class="space-y-3">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono text-slate-500">{{ task.taskNo }}</span>
                <Badge variant="outline" class="text-xs">
                  {{ task.status }}
                </Badge>
              </div>
              <p class="text-sm font-medium text-slate-800">{{ task.title }}</p>
              <p v-if="task.description" class="text-xs text-slate-600 mt-1">
                {{ task.description }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                :class="cn(
                  'text-xs',
                  task.priority === TaskPriority.URGENT ? 'bg-red-100 text-red-700' :
                  task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-700' :
                  task.priority === TaskPriority.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                  'bg-slate-100 text-slate-700'
                )"
              >
                {{ task.priority }}
              </Badge>
              <span v-if="task.estimatedHours" class="text-xs text-slate-500">
                {{ task.estimatedHours }}h
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p class="text-sm">暂无关联任务</p>
        <p class="text-xs mt-1">点击上方"AI 生成"按钮创建任务</p>
      </div>
    </CardContent>
  </Card>
</template>
