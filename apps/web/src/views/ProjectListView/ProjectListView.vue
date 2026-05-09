<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { projectsApi, type ProjectListParams } from "@/api/projects";
import type { ProjectResponseDto } from "@req2task/dto";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Sparkles,
  FileText,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProjectStatusSelect from "@/components/common/ProjectStatusSelect.vue";
import ProjectCard from "./ProjectCard.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const router = useRouter();
const loading = ref(false);
const projects = ref<ProjectResponseDto[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(12);
const keyword = ref("");
const status = ref<string>("");

const totalPages = computed(() => Math.ceil(total.value / limit.value));

const fetchProjects = async () => {
  loading.value = true;
  try {
    const params: ProjectListParams = {
      page: page.value,
      limit: limit.value,
      keyword: keyword.value || undefined,
      status: status.value || undefined,
    };
    const response = await projectsApi.getList(params);
    projects.value = response.items;
    total.value = response.total;
  } catch (error) {
    toast.error("获取项目列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchProjects();
};

const goToPage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    page.value = newPage;
    fetchProjects();
  }
};

onMounted(() => {
  fetchProjects();
});
</script>

<template>
  <div class="h-full">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            项目管理
          </h1>
          <p class="text-slate-500 mt-1">共 {{ total }} 个项目</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button class="gap-2">
              <Plus class="w-4 h-4" />
              新建项目
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="router.push('/projects/create')">
              <FileText class="w-4 h-4 mr-2" />
              快速创建
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="router.push('/projects/new/wizard')">
              <Sparkles class="w-4 h-4 mr-2" />
              向导创建（推荐）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card class="mb-6 border-slate-200/60 shadow-sm">
        <CardContent class="p-4">
          <div class="flex gap-4">
            <div class="relative flex-1 max-w-md">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <Input
                v-model="keyword"
                placeholder="搜索项目名称..."
                class="pl-10"
                @keyup.enter="handleSearch"
              />
            </div>
            <ProjectStatusSelect v-model="status" />
          </div>
        </CardContent>
      </Card>

      <div
        v-if="loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card v-for="i in 6" :key="i" class="border-slate-200/60">
          <CardHeader>
            <Skeleton class="h-5 w-32" />
            <Skeleton class="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div class="flex gap-4">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        v-else-if="projects.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <div
          class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4"
        >
          <FolderOpen class="w-10 h-10 text-slate-400" />
        </div>
        <p class="text-lg font-medium text-slate-700 mb-1">暂无项目</p>
        <p class="text-slate-500 mb-4">创建你的第一个项目开始吧</p>
        <Button
          variant="outline"
          class="gap-2"
          @click="router.push('/projects/create')"
        >
          <Plus class="w-4 h-4" />
          新建项目
        </Button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
      </div>

      <div
        v-if="totalPages > 1"
        class="flex items-center justify-center gap-2 mt-8"
      >
        <Button
          variant="outline"
          size="icon"
          :disabled="page === 1"
          @click="goToPage(page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </Button>
        <div class="flex items-center gap-1">
          <Button
            v-for="p in totalPages"
            :key="p"
            :variant="p === page ? 'default' : 'ghost'"
            size="sm"
            class="w-9"
            @click="goToPage(p)"
          >
            {{ p }}
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          :disabled="page === totalPages"
          @click="goToPage(page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
