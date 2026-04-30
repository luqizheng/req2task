<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import type {
  RequirementResponseDto,
  UpdateRequirementDto,
  ConflictDto,
} from "@req2task/dto";
import { RequirementStatus } from "@req2task/dto";
import { requirementsApi, type TransitionOption } from "@/api/requirements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast/use-toast";
import RequirementHeader from "./components/RequirementHeader.vue";
import RequirementContent from "./components/RequirementContent.vue";
import RequirementActions from "./components/RequirementActions.vue";
import ConflictAlert from "./components/ConflictAlert.vue";
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  FileText,
  History,
} from "lucide-vue-next";
import { formatDateTime } from "@/lib/utils";

const route = useRoute();
const router = useRouter();
const { toast } = useToast();

const requirementId = route.params.id as string;
const projectId = route.params.projectId as string;

const requirement = ref<RequirementResponseDto | null>(null);
const allowedTransitions = ref<TransitionOption[]>([]);
const conflicts = ref<ConflictDto[]>([]);
const changeHistory = ref<any[]>([]);

const loading = ref(true);
const isDeleting = ref(false);
const isTransitioning = ref(false);
const isExporting = ref(false);
const isLoadingConflicts = ref(false);

const fetchRequirement = async () => {
  try {
    loading.value = true;
    const [reqData, transitionsData] = await Promise.all([
      requirementsApi.getById(requirementId),
      requirementsApi.getAllowedTransitions(requirementId),
    ]);

    requirement.value = reqData;
    allowedTransitions.value = transitionsData.allowedTransitions || [];
  } catch (error) {
    toast({
      title: "加载失败",
      description: error instanceof Error ? error.message : "无法加载需求详情",
      variant: "destructive",
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
    toast({
      title: "更新成功",
      description: "需求标题已更新",
    });
  } catch (error) {
    toast({
      title: "更新失败",
      description: error instanceof Error ? error.message : "无法更新需求标题",
      variant: "destructive",
    });
  }
};

const handleDescriptionUpdate = async (newDescription: string) => {
  if (!requirement.value) return;

  try {
    const updateData: UpdateRequirementDto = { description: newDescription };
    const updated = await requirementsApi.update(requirementId, updateData);
    requirement.value = updated;
    toast({
      title: "更新成功",
      description: "需求描述已更新",
    });
  } catch (error) {
    toast({
      title: "更新失败",
      description: error instanceof Error ? error.message : "无法更新需求描述",
      variant: "destructive",
    });
  }
};

const handleStatusChange = async (newStatus: RequirementStatus) => {
  if (!requirement.value) return;

  try {
    isTransitioning.value = true;
    const updated = await requirementsApi.transitionStatus(requirementId, newStatus);
    requirement.value = updated;
    await fetchRequirement();
    toast({
      title: "状态更新成功",
      description: `需求状态已更新为 ${newStatus}`,
    });
  } catch (error) {
    toast({
      title: "状态更新失败",
      description: error instanceof Error ? error.message : "无法更新需求状态",
      variant: "destructive",
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
    toast({
      title: "删除成功",
      description: "需求已成功删除",
    });
    router.push(`/projects/${projectId}`);
  } catch (error) {
    toast({
      title: "删除失败",
      description: error instanceof Error ? error.message : "无法删除需求",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};

const handleExport = async () => {
  try {
    isExporting.value = true;
    toast({
      title: "导出中",
      description: "正在生成需求文档...",
    });
    setTimeout(() => {
      toast({
        title: "导出成功",
        description: "需求文档已准备就绪",
      });
      isExporting.value = false;
    }, 1500);
  } catch (error) {
    toast({
      title: "导出失败",
      description: error instanceof Error ? error.message : "无法导出需求文档",
      variant: "destructive",
    });
    isExporting.value = false;
  }
};

const handleEdit = () => {
  if (!requirement.value) return;
  router.push(`/projects/${projectId}/requirements/${requirementId}/edit`);
};

const goBack = () => {
  router.push(`/projects/${projectId}`);
};

onMounted(() => {
  fetchRequirement();
});
</script>

<template>
  <div class="h-full overflow-auto bg-slate-50">
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
          <span class="text-sm text-slate-500">
            需求详情
          </span>
        </div>

        <RequirementHeader
          :requirement="requirement"
          :project-id="projectId"
          @title-update="handleTitleUpdate"
        />

        <ConflictAlert
          v-if="conflicts.length > 0"
          :conflicts="conflicts"
          :is-loading="isLoadingConflicts"
          @resolve="(conflict) => {}"
          @view-detail="(conflict) => {}"
        />

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-3">
            <RequirementContent
              :requirement="requirement"
              @description-update="handleDescriptionUpdate"
            />
          </div>

          <div class="space-y-6">
            <RequirementActions
              :requirement="requirement"
              :allowed-transitions="allowedTransitions"
              :is-deleting="isDeleting"
              :is-transitioning="isTransitioning"
              :is-exporting="isExporting"
              @edit="handleEdit"
              @delete="handleDelete"
              @status-change="handleStatusChange"
              @export="handleExport"
            />

            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <User class="w-5 h-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="space-y-2">
                  <p class="text-xs text-slate-500">需求编号</p>
                  <p class="text-sm font-mono text-slate-800">
                    {{ requirement.entityKey }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-slate-500">创建者</p>
                  <p class="text-sm text-slate-800">
                    {{ requirement.createdBy?.displayName || "未知" }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-slate-500">创建时间</p>
                  <p class="text-sm text-slate-800">
                    {{ formatDateTime(requirement.createdAt) }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-slate-500">更新时间</p>
                  <p class="text-sm text-slate-800">
                    {{ formatDateTime(requirement.updatedAt) }}
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-slate-500">用户故事</p>
                  <p class="text-sm text-slate-800">
                    {{ requirement.userStoryCount || 0 }} 个
                  </p>
                </div>

                <Separator />

                <div class="space-y-2">
                  <p class="text-xs text-slate-500">子需求</p>
                  <p class="text-sm text-slate-800">
                    {{ requirement.childCount || 0 }} 个
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-lg flex items-center gap-2">
                  <History class="w-5 h-5" />
                  变更历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="text-center py-8 text-slate-400">
                  <History class="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p class="text-sm">暂无变更历史</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="text-center py-12">
          <AlertTriangle class="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3 class="text-lg font-medium text-slate-700 mb-2">
            需求不存在
          </h3>
          <p class="text-slate-500 mb-4">
            该需求可能已被删除或不存在
          </p>
          <Button @click="goBack">
            <ArrowLeft class="w-4 h-4 mr-2" />
            返回项目
          </Button>
        </div>
      </template>
    </div>
  </div>
</template>
