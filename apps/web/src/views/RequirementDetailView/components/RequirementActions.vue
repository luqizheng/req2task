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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Trash2, Download, AlertTriangle, AlertCircle } from "lucide-vue-next";
import { aiApi } from "@/api/ai";
import { toast } from "vue-sonner";

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

const confirmDelete = () => {
  emit("delete");
  showDeleteDialog.value = false;
};

const hasIssues = computed(() => {
  return props.checkResults?.hasDuplicate || props.checkResults?.hasConflict;
});

const isGenerating = ref(false);

const handleOneClickGenerate = async () => {
  if (!props.requirement.title && !props.requirement.description) {
    toast.error("需求标题或描述为空，无法生成");
    return;
  }

  try {
    isGenerating.value = true;

    const featurePointsResult = await aiApi.generateFeaturePointsForRequirement(
      props.requirement.id,
    );
    const featurePoints = featurePointsResult.featurePoints;

    const [userStoriesResult, tasksResult] = await Promise.all([
      aiApi.generateUserStoriesForRequirement(
        props.requirement.id,
        props.projectId,
        featurePoints,
      ),
      aiApi.generateTasksForRequirement(
        props.requirement.id,
        props.projectId,
        featurePoints,
      ),
    ]);

    const userStories = userStoriesResult.userStories;
    const tasks = tasksResult.tasks;

    if (userStories.length > 0) {
      const results = await Promise.allSettled(
        userStories.map((story) =>
          aiApi.generateAcceptanceCriteriaForUserStory(story.id),
        ),
      );
      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.filter((r) => r.status === "rejected").length;
      toast.success(
        `已生成 ${userStories.length} 个用户故事、${tasks.length} 个任务、${successCount} 组验收条件` +
          (failCount > 0 ? `（${failCount} 组失败）` : ""),
      );
    } else {
      toast.success(`已生成 ${userStories.length} 个用户故事、${tasks.length} 个任务`);
    }

    emit("generated");
    emit("tasks-updated");
  } catch (error) {
    toast.error("一键生成失败", {
      description: error instanceof Error ? error.message : "请稍后重试",
    });
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <Card>
    <CardHeader>
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
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        操作
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button
        variant="default"
        class="w-full justify-start gap-2"
        :disabled="isGenerating"
        @click="handleOneClickGenerate"
      >
        <Loader2 v-if="isGenerating" class="w-4 h-4 mr-2 animate-spin" />
        <Sparkles v-else class="w-4 h-4 mr-2" />
        {{ isGenerating ? '生成中...' : 'AI 一键生成' }}
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
  </Card>
</template>
