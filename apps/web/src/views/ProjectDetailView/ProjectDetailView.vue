<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { projectsApi } from "@/api/projects";
import type { ProjectResponseDto, ProjectProgressDto } from "@req2task/dto";
import { ProjectStatus } from "@req2task/dto";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  Layers,
  ListTodo,
  GitBranch,
  FileText,
  Settings,
  RefreshCw,
} from "lucide-vue-next";
import ProjectInfoCard from "./components/ProjectInfoCard.vue";
import ProjectProgressCard from "./components/ProjectProgressCard.vue";
import ProjectModulesCard from "./components/ProjectModulesCard/ProjectModulesCard.vue";
import ProjectRequirementsCard from "./components/ProjectRequirementsCard.vue";
import ProjectTasksCard from "./components/ProjectTasksCard.vue";
import ProjectBaselinesCard from "./components/ProjectBaselinesCard.vue";
import ProjectRawRequirementsCard from "./components/ProjectRawRequirementsCard.vue";
import VectorRebuildCard from "./components/VectorRebuildCard.vue";

const route = useRoute();
const router = useRouter();
const projectId = route.params.id as string;

const project = ref<ProjectResponseDto | null>(null);
const progress = ref<ProjectProgressDto | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isRefreshing = ref(false);

const statusConfig: Record<ProjectStatus, { label: string; class: string; dot: string }> = {
  [ProjectStatus.PLANNING]: {
    label: "规划中",
    class: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  [ProjectStatus.ACTIVE]: {
    label: "进行中",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  [ProjectStatus.ON_HOLD]: {
    label: "暂停",
    class: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  [ProjectStatus.COMPLETED]: {
    label: "已完成",
    class: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  [ProjectStatus.ARCHIVED]: {
    label: "已归档",
    class: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const tabItems = [
  { value: "overview", label: "概览", icon: LayoutDashboard },
  { value: "modules", label: "功能模块", icon: Layers },
  { value: "requirements", label: "需求", icon: ListTodo },
  { value: "tasks", label: "任务", icon: GitBranch },
  { value: "baselines", label: "基线", icon: FileText },
  { value: "raw-requirements", label: "原始需求", icon: FileText },
  { value: "settings", label: "设置", icon: Settings },
];

const quickStats = computed(() => {
  if (!progress.value) return [];
  return [
    { label: "需求", value: progress.value.completedRequirements, total: progress.value.totalRequirements },
    { label: "任务", value: progress.value.completedTasks, total: progress.value.totalTasks },
  ];
});

const fetchProjectData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const [projectData, progressData] = await Promise.all([
      projectsApi.getById(projectId),
      projectsApi.getProgress(projectId),
    ]);

    project.value = projectData;
    progress.value = progressData;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载项目数据失败";
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  isRefreshing.value = true;
  await fetchProjectData();
  isRefreshing.value = false;
};

const goBack = () => {
  router.push("/projects");
};

onMounted(() => {
  fetchProjectData();
});
</script>

<template>
  <div class="h-full p-6 overflow-auto bg-slate-50/50">
    <div class="max-w-7xl mx-auto space-y-6">
      <nav v-if="loading || project" class="flex items-center gap-2 text-sm">
        <button
          class="text-slate-500 hover:text-slate-800 transition-colors"
          @click="goBack"
        >
          项目列表
        </button>
        <ChevronRight class="w-4 h-4 text-slate-300" />
        <span class="text-slate-800 font-medium">
          {{ loading ? "加载中..." : project?.name }}
        </span>
      </nav>

      <div v-if="loading" class="space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-3">
            <Skeleton class="h-9 w-64" />
            <Skeleton class="h-5 w-32" />
          </div>
          <div class="flex gap-3">
            <Skeleton class="h-10 w-24" />
            <Skeleton class="h-10 w-32" />
          </div>
        </div>
        <Skeleton class="h-14 w-full rounded-lg" />
        <div class="grid grid-cols-3 gap-4">
          <Skeleton class="h-48 rounded-xl" />
          <Skeleton class="h-48 rounded-xl" />
          <Skeleton class="h-48 rounded-xl" />
        </div>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle class="w-8 h-8 text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-slate-800 mb-2">加载失败</h3>
        <p class="text-slate-500 mb-6 max-w-md">{{ error }}</p>
        <Button variant="outline" @click="fetchProjectData">
          <RefreshCw class="w-4 h-4 mr-2" />
          重试
        </Button>
      </div>

      <template v-else-if="project">
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                  {{ project.name }}
                </h1>
                <Badge
                  :class="statusConfig[project.status]?.class"
                  variant="outline"
                  class="px-2.5 py-0.5 font-medium text-xs"
                >
                  <span
                    :class="['w-1.5 h-1.5 rounded-full mr-1.5', statusConfig[project.status]?.dot]"
                  />
                  {{ statusConfig[project.status]?.label || project.status }}
                </Badge>
              </div>
              <p class="text-sm text-slate-500 font-mono">{{ project.projectKey }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="isRefreshing"
                @click="refresh"
              >
                <RefreshCw
                  class="w-4 h-4 mr-2"
                  :class="{ 'animate-spin': isRefreshing }"
                />
                刷新
              </Button>
              <Button size="sm">
                <Settings class="w-4 h-4 mr-2" />
                项目设置
              </Button>
            </div>
          </div>

          <div
            v-if="quickStats.length > 0"
            class="flex items-center gap-8 mt-6 pt-6 border-t border-slate-100"
          >
            <div
              v-for="stat in quickStats"
              :key="stat.label"
              class="flex items-center gap-3"
            >
              <span class="text-2xl font-bold text-slate-900">{{ stat.value }}</span>
              <span class="text-sm text-slate-500">/ {{ stat.total }} {{ stat.label }}</span>
            </div>
          </div>
        </div>

        <Tabs default-value="overview" class="w-full">
          <TabsList class="h-12 bg-white border border-slate-200 p-1 rounded-lg shadow-sm gap-1">
            <TabsTrigger
              v-for="item in tabItems"
              :key="item.value"
              :value="item.value"
              class="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 h-10 px-4 font-medium text-sm transition-all"
            >
              <component :is="item.icon" class="w-4 h-4 mr-2" />
              {{ item.label }}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" class="mt-6">
            <ProjectProgressCard v-if="progress" :progress="progress" />
          </TabsContent>

          <TabsContent value="modules" class="mt-6">
            <ProjectModulesCard :project-id="projectId" />
          </TabsContent>

          <TabsContent value="requirements" class="mt-6">
            <ProjectRequirementsCard :project-id="projectId" />
          </TabsContent>

          <TabsContent value="tasks" class="mt-6">
            <ProjectTasksCard :project-id="projectId" />
          </TabsContent>

          <TabsContent value="baselines" class="mt-6">
            <ProjectBaselinesCard :project-id="projectId" />
          </TabsContent>

          <TabsContent value="raw-requirements" class="mt-6">
            <ProjectRawRequirementsCard :project-id="projectId" />
          </TabsContent>

          <TabsContent value="settings" class="mt-6 space-y-6">
            <ProjectInfoCard
              :project="project"
              :is-settings="true"
            />
            <VectorRebuildCard :project-id="projectId" />
          </TabsContent>
        </Tabs>
      </template>
    </div>
  </div>
</template>
