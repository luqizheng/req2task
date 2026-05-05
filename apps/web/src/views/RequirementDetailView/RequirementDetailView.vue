<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type {
  RequirementResponseDto,
  RequirementDto as UpdateRequirementDto,
  ConflictDto,
  SimilarRequirementDto,
  RequirementCheckRequestDto,
} from "@req2task/dto";
import { RequirementStatus, ConflictType } from "@req2task/dto";
import { requirementsApi, type TransitionOption } from "@/api/requirements";
import { aiApi } from "@/api/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";


import RequirementHeader from "./components/RequirementHeader.vue";
import RequirementContent from "./components/RequirementContent.vue";
import RequirementActions from "./components/RequirementActions.vue";
import RequirementModules from "./components/RequirementModules.vue";
import RequirementTasks from "./components/RequirementTasks.vue";
import ConflictAlert from "./components/ConflictAlert.vue";
import ChangeHistoryCard from "./components/ChangeHistoryCard.vue";
import { ArrowLeft, AlertTriangle, User } from "lucide-vue-next";
import { formatDateTime } from "@/lib/utils";
import { toast } from "vue-sonner";
import { mapStatusesToOptions } from "@/utils/status-mapping";

interface TransitionOptionWithLabel {
  to: string;
  label: string;
  color: string;
}

const route = useRoute();
const router = useRouter();

const requirementId = route.params.id as string;
const projectId = route.params.projectId as string;

const requirement = ref<RequirementResponseDto | null>(null);
const allowedTransitionsRaw = ref<TransitionOption[]>([]);
const conflicts = ref<ConflictDto[]>([]);
const refreshTasksKey = ref(0);

const allowedTransitions = computed<TransitionOptionWithLabel[]>(() => {
  
  return mapStatusesToOptions(allowedTransitionsRaw.value);
});

const loading = ref(true);
const isDeleting = ref(false);
const isTransitioning = ref(false);
const isExporting = ref(false);
const isLoadingConflicts = ref(false);
const isCheckingConflicts = ref(false);
const checkResults = ref<{
  hasDuplicate: boolean;
  hasConflict: boolean;
  duplicateRequirements: Array<{ id: string; title: string; description: string; score: number }>;
  conflictRequirements: Array<{ id: string; title: string; description: string; score: number }>;
  conflictDescription?: string;
} | null>(null);

const fetchRequirement = async () => {
  try {
    loading.value = true;
    const [reqData, transitionsData] = await Promise.all([
      requirementsApi.getById(requirementId),
      requirementsApi.getAllowedTransitions(requirementId),
    ]);
   
    requirement.value = reqData;
    allowedTransitionsRaw.value = transitionsData|| [];
  } catch (error) {
    toast.error("加载失败", {
      description: error instanceof Error ? error.message : "无法加载需求详情",
    });
  } finally {
    loading.value = false;
  }
};

const handleTitleUpdate = async (newTitle: string) => {
  if (!requirement.value) return;

  try {
    const updateData: UpdateRequirementDto = { title: newTitle };
    const updated = await requirementsApi.update(requirementId, updateData);
    requirement.value = updated;
    toast.success("更新成功", {
      description: "需求标题已更新",
    });
  } catch (error) {
    toast.error("更新失败", {
      description: error instanceof Error ? error.message : "无法更新需求标题",
    });
  }
};

const handleDescriptionUpdate = async (newDescription: string) => {
  if (!requirement.value) return;

  try {
    const updateData: UpdateRequirementDto = { description: newDescription };
    const updated = await requirementsApi.update(requirementId, updateData);
    requirement.value = updated;
    toast.success("更新成功", {
      description: "需求描述已更新",
    });
  } catch (error) {
    toast.error("更新失败", {
      description: error instanceof Error ? error.message : "无法更新需求描述",
    });
  }
};

const handleFeaturePointsUpdate = async (newFeaturePoints: string) => {
  if (!requirement.value) return;

  try {
    const updateData: UpdateRequirementDto = { featurePoints: newFeaturePoints };
    const updated = await requirementsApi.update(requirementId, updateData);
    requirement.value = updated;
    toast.success("更新成功", {
      description: "功能点已更新",
    });
  } catch (error) {
    toast.error("更新失败", {
      description: error instanceof Error ? error.message : "无法更新功能点",
    });
  }
};

const handleStatusChange = async (newStatus: RequirementStatus) => {
  if (!requirement.value) return;

  try {
    isTransitioning.value = true;
    const updated = await requirementsApi.transitionStatus(
      requirementId,
      newStatus,
    );
    requirement.value = updated;
    await fetchRequirement();
    toast.success("状态更新成功", {
      description: `需求状态已更新为 ${newStatus}`,
    });
  } catch (error) {
    toast.error("状态更新失败", {
      description: error instanceof Error ? error.message : "无法更新需求状态",
    });
  } finally {
    isTransitioning.value = false;
  }
};

const handleDelete = async () => {
  if (!requirement.value) return;

  try {
    isDeleting.value = true;
    await requirementsApi.delete(requirementId);
    toast.success("删除成功", {
      description: "需求已成功删除",
    });
    router.push(`/projects/${projectId}`);
  } catch (error) {
    toast.error("删除失败", {
      description: error instanceof Error ? error.message : "无法删除需求",
    });
  } finally {
    isDeleting.value = false;
  }
};

const handleExport = async () => {
  try {
    isExporting.value = true;
    toast("导出中", {
      description: "正在生成需求文档...",
    });
    setTimeout(() => {
      toast.success("导出成功", {
        description: "需求文档已准备就绪",
      });
      isExporting.value = false;
    }, 1500);
  } catch (error) {
    toast.error("导出失败", {
      description: error instanceof Error ? error.message : "无法导出需求文档",
    });
    isExporting.value = false;
  }
};

const handleEdit = () => {
  if (!requirement.value) return;
  router.push(`/projects/${projectId}/requirements/${requirementId}/edit`);
};

const handleCheckConflicts = async () => {
  if (!requirement.value) return;

  try {
    isCheckingConflicts.value = true;
    toast("正在检查重复和冲突...", {
      description: "请稍候",
    });

    const response = await aiApi.checkRequirements({
      projectId: projectId,
      requirements: [
        {
          id: requirementId,
          title: requirement.value.title,
          description: requirement.value.description || "",
        },
      ],
    } as RequirementCheckRequestDto);

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      checkResults.value = {
        hasDuplicate: result.hasDuplicate,
        hasConflict: result.hasConflict,
        duplicateRequirements: result.duplicateRequirements,
        conflictRequirements: result.conflictRequirements,
        conflictDescription: result.conflictDescription,
      };

      const newConflicts: ConflictDto[] = [];

      if (result.hasDuplicate) {
        result.duplicateRequirements.forEach((dup: SimilarRequirementDto) => {
          newConflicts.push({
            requirement1: {
              id: requirementId,
              content: requirement.value!.description || "",
            },
            requirement2: {
              id: dup.id,
              content: dup.description,
            },
            type: ConflictType.FUNCTIONAL,
            description: `与需求"${dup.title}"存在重复，相似度 ${(dup.score * 100).toFixed(0)}%`,
            suggestion: `建议保留其中一个需求，或合并重复内容`,
          });
        });
      }

      if (result.hasConflict) {
        result.conflictRequirements.forEach((conflict: SimilarRequirementDto) => {
          newConflicts.push({
            requirement1: {
              id: requirementId,
              content: requirement.value!.description || "",
            },
            requirement2: {
              id: conflict.id,
              content: conflict.description,
            },
            type: ConflictType.LOGICAL,
            description: result.conflictDescription || `与需求"${conflict.title}"存在逻辑冲突，相似度 ${(conflict.score * 100).toFixed(0)}%`,
            suggestion: `建议与相关方讨论确认需求优先级和范围`,
          });
        });
      }

      conflicts.value = newConflicts;

      if (result.hasDuplicate || result.hasConflict) {
        toast.warning(
          `发现 ${result.hasDuplicate ? "重复" : ""}${result.hasDuplicate && result.hasConflict ? "和" : ""}${result.hasConflict ? "冲突" : ""}需求`,
          {
            description: "请查看详情",
          }
        );
      } else {
        toast.success("检查完成", {
          description: "未发现重复或冲突",
        });
      }
    }
  } catch (error) {
    toast.error("检查失败", {
      description: error instanceof Error ? error.message : "无法检查重复和冲突",
    });
  } finally {
    isCheckingConflicts.value = false;
  }
};

const goBack = () => {
  router.push(`/projects/${projectId}`);
};

const handleTasksUpdated = () => {
  refreshTasksKey.value += 1;
};

const handleUserStoriesAdded = (stories: any[]) => {
  if (requirement.value && requirement.value.userStories) {
    requirement.value.userStories = [...requirement.value.userStories, ...stories];
  }
};

onMounted(() => {
  fetchRequirement();
});
</script>

<template>
  <div class="h-full overflow-auto bg-muted">
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <div v-if="loading" class="space-y-6">
        <div class="space-y-4">
          <Skeleton class="h-4 w-1/4" />
          <Skeleton class="h-8 w-2/4" />
          <Skeleton class="h-6 w-1/3" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-3 space-y-6">
            <Skeleton class="h-64" />
            <Skeleton class="h-96" />
          </div>
          <div class="space-y-6">
            <Skeleton class="h-48" />
          </div>
        </div>
      </div>

      <template v-else-if="requirement">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="goBack">
            <ArrowLeft class="w-4 h-4 mr-2" />
            返回
          </Button>
          <Separator orientation="vertical" class="h-6" />
          <span class="text-sm text-muted-foreground"> 需求详情 </span>
        </div>

        <RequirementHeader
          :requirement="requirement"
          :project-id="projectId"
          :allowed-transitions="allowedTransitions"
          :is-transitioning="isTransitioning"
          @title-update="handleTitleUpdate"
          @status-change="handleStatusChange"
        />

        <ConflictAlert
          v-if="conflicts.length > 0"
          :conflicts="conflicts"
          :is-loading="isLoadingConflicts"
        
        />

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-3 space-y-6">
            <RequirementContent
              :requirement="requirement"
              :project-id="projectId"
              @description-update="handleDescriptionUpdate"
              @feature-points-update="handleFeaturePointsUpdate"
              @feature-points-generated="fetchRequirement"
              @user-stories-added="handleUserStoriesAdded"
              @tasks-updated="fetchRequirement"
            />

            <RequirementTasks
              v-if="requirement"
              :requirement="requirement"
              :requirement-id="requirement.id"
              :project-id="projectId"
              :refresh-key="refreshTasksKey"
              @tasks-updated="fetchRequirement"
            />
          </div>

          <div class="space-y-6">
            <RequirementActions
              :requirement="requirement"
              :project-id="projectId"
              :allowed-transitions="allowedTransitions"
              :is-deleting="isDeleting"
              :is-transitioning="isTransitioning"
              :is-exporting="isExporting"
              :is-checking-conflicts="isCheckingConflicts"
              :check-results="checkResults"
              @edit="handleEdit"
              @delete="handleDelete"
              @status-change="handleStatusChange"
              @export="handleExport"
              @check-conflicts="handleCheckConflicts"
              @generated="fetchRequirement"
              @tasks-updated="handleTasksUpdated"
            />

            <RequirementModules :requirement="requirement" />

            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <User class="w-5 h-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">需求编号</p>
                  <p class="text-sm font-mono text-foreground">
                    {{ requirement.entityKey }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">创建者</p>
                  <p class="text-sm text-foreground">
                    {{ requirement.createdBy?.displayName || "未知" }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">创建时间</p>
                  <p class="text-sm text-foreground">
                    {{ formatDateTime(requirement.createdAt) }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">更新时间</p>
                  <p class="text-sm text-foreground">
                    {{ formatDateTime(requirement.updatedAt) }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">功能点</p>
                  <p class="text-sm text-foreground">
                    {{ requirement.featurePoints ? '已生成' : '未生成' }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">用户故事</p>
                  <p class="text-sm text-foreground">
                    {{ requirement.userStoryCount || 0 }} 个
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">子需求</p>
                  <p class="text-sm text-foreground">
                    {{ requirement.childCount || 0 }} 个
                  </p>
                </div>
              </CardContent>
            </Card>

            <ChangeHistoryCard
              v-if="requirement"
              :requirement="requirement"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="text-center py-12">
          <AlertTriangle class="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 class="text-lg font-medium text-foreground mb-2">需求不存在</h3>
          <p class="text-muted-foreground mb-4">该需求可能已被删除或不存在</p>
          <Button @click="goBack">
            <ArrowLeft class="w-4 h-4 mr-2" />
            返回项目
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>
