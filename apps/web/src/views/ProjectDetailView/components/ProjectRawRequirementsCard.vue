<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { RawRequirementStatus, CollectionType } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileQuestion,
  Plus,
  MoreHorizontal,
  RefreshCw,
  ClipboardList,
  Edit3,
  MessageSquare,
  Calendar,
  User,
} from "lucide-vue-next";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { rawRequirementsApi } from "@/api/rawRequirements";

dayjs.locale("zh-cn");

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const rawRequirements = ref<RawRequirementResponseDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const isRefreshing = ref(false);

const statusConfig: Record<RawRequirementStatus, { label: string; class: string }> = {
  [RawRequirementStatus.PENDING]: { label: "待处理", class: "bg-slate-100 text-slate-700" },
  [RawRequirementStatus.PROCESSING]: { label: "处理中", class: "bg-blue-100 text-blue-700" },
  [RawRequirementStatus.COMPLETED]: { label: "已完成", class: "bg-emerald-100 text-emerald-700" },
  [RawRequirementStatus.CLARIFIED]: { label: "已澄清", class: "bg-indigo-100 text-indigo-700" },
  [RawRequirementStatus.CONVERTED]: { label: "已转换", class: "bg-purple-100 text-purple-700" },
  [RawRequirementStatus.DISCARDED]: { label: "已废弃", class: "bg-red-100 text-red-700" },
  [RawRequirementStatus.FAILED]: { label: "失败", class: "bg-red-100 text-red-700" },
};

const collectionTypeConfig: Record<CollectionType, { label: string; icon: string }> = {
  [CollectionType.MEETING]: { label: "会议", icon: "users" },
  [CollectionType.INTERVIEW]: { label: "访谈", icon: "mic" },
  [CollectionType.DOCUMENT]: { label: "文档", icon: "file-text" },
  [CollectionType.OTHER]: { label: "其他", icon: "more" },
};

const fetchRawRequirements = async () => {
  try {
    loading.value = true;
    error.value = null;
    const items = await rawRequirementsApi.getByProject(props.projectId, {});
    rawRequirements.value = items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载原始需求失败";
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  isRefreshing.value = true;
  await fetchRawRequirements();
  isRefreshing.value = false;
};

const goToCollect = () => {
  router.push(`/projects/${props.projectId}/raw-requirements/new`);
};

const goToEditor = (rawRequirementId?: string) => {
  if (rawRequirementId) {
    router.push(`/projects/${props.projectId}/raw-requirements/${rawRequirementId}`);
  } else {
    router.push(`/projects/${props.projectId}/raw-requirements/new`);
  }
};

const goToDetail = (rawRequirementId: string) => {
  router.push(`/projects/${props.projectId}/raw-requirements/${rawRequirementId}`);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "未设置";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("MM-DD HH:mm") : dateStr;
};

onMounted(() => {
  fetchRawRequirements();
});

defineExpose({
  refresh,
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <FileQuestion class="w-5 h-5" />
          原始需求
          <Badge v-if="rawRequirements.length > 0" variant="secondary" class="text-xs">
            {{ rawRequirements.length }}
          </Badge>
        </CardTitle>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            :disabled="isRefreshing"
            @click="refresh"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="sm">
                <Plus class="w-4 h-4 mr-2" />
                新增
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="goToCollect">
                <ClipboardList class="w-4 h-4 mr-2" />
                收集需求
              </DropdownMenuItem>
              <DropdownMenuItem @click="goToEditor()">
                <Edit3 class="w-4 h-4 mr-2" />
                录入需求
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-24 w-full" />
        <Skeleton class="h-24 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <Button variant="outline" size="sm" @click="refresh">
          <RefreshCw class="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>

      <div v-else-if="rawRequirements.length === 0" class="text-center py-12">
        <FileQuestion class="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p class="text-slate-500 mb-2">暂无原始需求</p>
        <p class="text-slate-400 text-sm mb-4">开始收集项目需求</p>
        <div class="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" @click="goToCollect">
            <ClipboardList class="w-4 h-4 mr-2" />
            收集需求
          </Button>
          <Button size="sm" @click="goToEditor()">
            <Plus class="w-4 h-4 mr-2" />
            录入需求
          </Button>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="raw in rawRequirements"
          :key="raw.id"
          class="group relative p-4 border rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0 cursor-pointer" @click="goToDetail(raw.id)">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="font-medium text-slate-800 truncate">
                  {{ raw.title || "未命名需求" }}
                </h4>
                <Badge
                  :class="statusConfig[raw.status]?.class"
                  class="text-xs shrink-0"
                >
                  {{ statusConfig[raw.status]?.label || raw.status }}
                </Badge>
              </div>
              <p class="text-sm text-slate-600 line-clamp-2 mb-3">
                {{ raw.content }}
              </p>
              <div class="flex items-center gap-4 text-xs text-slate-400">
                <span v-if="raw.source" class="flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ raw.source }}
                </span>
                <span v-if="raw.collectionType" class="flex items-center gap-1">
                  <MessageSquare class="w-3 h-3" />
                  {{ collectionTypeConfig[raw.collectionType]?.label || raw.collectionType }}
                </span>
                <span v-if="raw.collectTime" class="flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(raw.collectTime) }}
                </span>
                <span class="flex items-center gap-1">
                  <MessageSquare class="w-3 h-3" />
                  {{ raw.questionAndAnswers?.length || 0 }} 问答
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="goToDetail(raw.id)">
                  <FileQuestion class="w-4 h-4 mr-2" />
                  查看详情
                </DropdownMenuItem>
                <DropdownMenuItem @click="goToEditor(raw.id)">
                  <Edit3 class="w-4 h-4 mr-2" />
                  编辑
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
