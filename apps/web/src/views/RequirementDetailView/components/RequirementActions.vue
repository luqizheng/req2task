<script setup lang="ts">
import { ref, computed } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Trash2, Download, AlertTriangle, AlertCircle, CheckCircle2, Settings } from "lucide-vue-next";
import { aiApi } from "@/api/ai";
import { toast } from "vue-sonner";

interface ProgressStep {
  id: string;
  label: string;
  subLabel?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

const props = defineProps<{
  requirement: RequirementResponseDto;
  projectId: string;
  isDeleting?: boolean;
  isExporting?: boolean;
  isCheckingConflicts?: boolean;
  checkResults?: {
    hasDuplicate: boolean;
    hasConflict: boolean;
    duplicateRequirements: Array<{ id: string; title: string; description: string; score: number }>;
    conflictRequirements: Array<{ id: string; title: string; description: string; score: number }>;
    conflictDescription?: string;
  } | null;
}>();

const emit = defineEmits<{
  (e: "delete"): void;
  (e: "export"): void;
  (e: "check-conflicts"): void;
  (e: "generated"): void;
  (e: "tasks-updated"): void;
}>();

const showDeleteDialog = ref(false);
const showProgressDialog = ref(false);

const confirmDelete = () => {
  emit("delete");
  showDeleteDialog.value = false;
};

const hasIssues = computed(() => {
  return props.checkResults?.hasDuplicate || props.checkResults?.hasConflict;
});

const progressSteps = ref<ProgressStep[]>([]);

const updateStep = (id: string, status: ProgressStep['status'], subLabel?: string) => {
  const step = progressSteps.value.find(s => s.id === id);
  if (step) {
    step.status = status;
    if (subLabel !== undefined) {
      step.subLabel = subLabel;
    }
  }
};

const initProgress = () => {
  progressSteps.value = [
    { id: 'featurePoints', label: '生成功能点', status: 'pending' },
    { id: 'userStories', label: '生成用户故事', status: 'pending' },
    { id: 'acceptanceCriteria', label: '生成验收条件', status: 'pending' },
    { id: 'tasks', label: '生成任务', status: 'pending' },
  ];
};

const handleOneClickGenerate = async () => {
  if (!props.requirement.title && !props.requirement.description) {
    toast.error("需求标题或描述为空，无法生成");
    return;
  }

  try {
    initProgress();
    showProgressDialog.value = true;

    updateStep('featurePoints', 'running');
    const featurePointsResult = await aiApi.generateFeaturePointsForRequirement(
      props.requirement.id,
    );
    const featurePoints = featurePointsResult.featurePoints;
    updateStep('featurePoints', 'completed');

    updateStep('userStories', 'running');
    const userStoriesResult = await aiApi.generateUserStoriesForRequirement(
      props.requirement.id,
      props.projectId,
      featurePoints,
    );
    const userStories = userStoriesResult.userStories;
    updateStep('userStories', 'completed');

    updateStep('acceptanceCriteria', 'running');
    let successCount = 0;
    let failCount = 0;
    if (userStories.length > 0) {
      for (let i = 0; i < userStories.length; i++) {
        const story = userStories[i];
        updateStep('acceptanceCriteria', 'running', `(${i + 1}/${userStories.length}) ${story.goal}`);
        try {
          await aiApi.generateAcceptanceCriteriaForUserStory(story.id);
          successCount++;
        } catch {
          failCount++;
        }
      }
    }
    updateStep('acceptanceCriteria', 'completed');

    updateStep('tasks', 'running');
    const tasksResult = await aiApi.generateTasksForRequirement(
      props.requirement.id,
      props.projectId,
      featurePoints,
    );
    const tasks = tasksResult.tasks;
    updateStep('tasks', 'completed');

    setTimeout(() => {
      showProgressDialog.value = false;
      toast.success(
        `已生成 ${userStories.length} 个用户故事、${tasks.length} 个任务、${successCount} 组验收条件` +
          (failCount > 0 ? `（${failCount} 组失败）` : ""),
      );
      emit("generated");
      emit("tasks-updated");
    }, 500);
  } catch (error) {
    showProgressDialog.value = false;
    toast.error("一键生成失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  }
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg flex items-center gap-2">
        <Settings class="w-5 h-5" />
        操作
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button
        variant="default"
        class="w-full justify-start gap-2"
        @click="handleOneClickGenerate"
      >
        <Sparkles class="w-4 h-4 mr-2" />
        AI 一键生成
      </Button>

      <Button
        variant="outline"
        class="w-full justify-start"
        :disabled="isCheckingConflicts"
        @click="emit('check-conflicts')"
      >
        <Loader2 v-if="isCheckingConflicts" class="w-4 h-4 mr-2 animate-spin" />
        <AlertTriangle v-else-if="hasIssues" class="w-4 h-4 mr-2 text-orange-500" />
        <AlertCircle v-else class="w-4 h-4 mr-2" />
        检查重复和冲突
      </Button>

      <Button
        variant="outline"
        class="w-full justify-start"
        :disabled="isExporting"
        @click="emit('export')"
      >
        <Download v-if="!isExporting" class="w-4 h-4 mr-2" />
        <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
        导出需求文档
      </Button>

      <AlertDialog v-model:open="showDeleteDialog">
        <AlertDialogTrigger as-child>
          <Button
            variant="destructive"
            class="w-full justify-start"
            :disabled="isDeleting"
          >
            <Trash2 v-if="!isDeleting" class="w-4 h-4 mr-2" />
            <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
            删除需求
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除需求 "<strong>{{ requirement.title }}</strong
              >" 吗？ 此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" @click="confirmDelete">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CardContent>

    <Dialog v-model:open="showProgressDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-blue-500" />
            AI 正在生成中...
          </DialogTitle>
          <DialogDescription>
            请稍候，系统正在为您生成需求相关内容
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-3">
          <div
            v-for="step in progressSteps"
            :key="step.id"
            class="flex items-center gap-3 text-sm"
          >
            <template v-if="step.status === 'completed'">
              <CheckCircle2 class="w-5 h-5 text-green-500 flex-shrink-0" />
              <span class="text-green-600">{{ step.label }}</span>
            </template>
            <template v-else-if="step.status === 'running'">
              <Loader2 class="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
              <span class="text-blue-600 font-medium">{{ step.label }}</span>
              <span v-if="step.subLabel" class="text-blue-400 text-xs">- {{ step.subLabel }}</span>
            </template>
            <template v-else-if="step.status === 'error'">
              <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0" />
              <span class="text-red-600">{{ step.label }} 失败</span>
            </template>
            <template v-else>
              <div class="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
              <span class="text-slate-400">{{ step.label }}</span>
            </template>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </Card>
</template>
