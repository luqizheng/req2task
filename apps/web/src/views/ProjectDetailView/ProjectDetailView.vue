<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { projectsApi } from "@/api/projects";
import type { ProjectResponseDto, ProjectProgressDto } from "@req2task/dto";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectInfoCard from "./components/ProjectInfoCard.vue";
import ProjectProgressCard from "./components/ProjectProgressCard.vue";
import ProjectModulesCard from "./components/ProjectModulesCard.vue";
import ProjectRequirementsCard from "./components/ProjectRequirementsCard.vue";
import ProjectTasksCard from "./components/ProjectTasksCard.vue";
import ProjectBaselinesCard from "./components/ProjectBaselinesCard.vue";
import ProjectRawRequirementsCard from "./components/ProjectRawRequirementsCard.vue";

const route = useRoute();
const projectId = route.params.id as string;

const project = ref<ProjectResponseDto | null>(null);
const progress = ref<ProjectProgressDto | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

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

onMounted(() => {
  fetchProjectData();
});
</script>

<template>
  <div class="h-full p-6 overflow-auto">
    <div class="max-w-7xl mx-auto space-y-6">
      <div v-if="loading" class="space-y-6">
        <Skeleton class="h-12 w-1/3" />
        <Skeleton class="h-64 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500">{{ error }}</p>
      </div>

      <template v-else-if="project">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-slate-800">
              {{ project.name }}
            </h1>
            <p class="text-slate-500 mt-1">{{ project.projectKey }}</p>
          </div>
        </div>

        <Tabs default-value="overview" class="w-full">
          <TabsList class="grid w-full grid-cols-7">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="modules">功能模块</TabsTrigger>
            <TabsTrigger value="requirements">需求</TabsTrigger>
            <TabsTrigger value="tasks">任务</TabsTrigger>
            <TabsTrigger value="baselines">基线</TabsTrigger>
            <TabsTrigger value="raw-requirements">原始需求</TabsTrigger>
            <TabsTrigger value="settings">设置</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" class="mt-6 space-y-6">
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

          <TabsContent value="settings" class="mt-6">
            <ProjectInfoCard
              :project="project"
              :is-settings="true"
            />
          </TabsContent>
        </Tabs>
      </template>
    </div>
  </div>
</template>
