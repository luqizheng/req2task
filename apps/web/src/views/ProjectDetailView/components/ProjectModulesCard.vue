<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderTree,
  Plus,
  ChevronRight,
  Folder,
  Layers,
} from "lucide-vue-next";
import api from "@/api/axios";

interface FeatureModule {
  id: string;
  name: string;
  description: string | null;
  moduleKey: string;
  sort: number;
  parentId: string | null;
  children: FeatureModule[];
}

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const modules = ref<FeatureModule[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchModules = async () => {
  try {
    loading.value = true;
    const response = await api.get<{ items: FeatureModule[] }>(`/projects/${props.projectId}/modules`);
    modules.value = response.items || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载模块失败";
  } finally {
    loading.value = false;
  }
};

const goToModule = (moduleId: string) => {
  router.push(`/projects/${props.projectId}/modules/${moduleId}`);
};

onMounted(() => {
  fetchModules();
});
</script>

<template>
  <Card class="border-slate-200 shadow-sm overflow-hidden">
    <CardHeader class="pb-4 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Layers class="w-4 h-4 text-emerald-600" />
          </div>
          <CardTitle class="text-slate-800">功能模块</CardTitle>
          <span class="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-xs">
            {{ modules.length }}
          </span>
        </div>
        <Button size="sm" class="shadow-sm">
          <Plus class="w-4 h-4 mr-2" />
          新建模块
        </Button>
      </div>
    </CardHeader>
    <CardContent class="p-6">
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-14 w-full rounded-lg" />
        <Skeleton class="h-14 w-full rounded-lg" />
        <Skeleton class="h-14 w-full rounded-lg" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <FolderTree class="w-6 h-6 text-red-400" />
        </div>
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <div
        v-else-if="modules.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Folder class="w-8 h-8 text-slate-400" />
        </div>
        <h3 class="text-sm font-medium text-slate-700 mb-1">暂无功能模块</h3>
        <p class="text-xs text-slate-400 mb-4">点击下方按钮创建第一个模块</p>
        <Button variant="outline" size="sm">
          <Plus class="w-4 h-4 mr-2" />
          创建模块
        </Button>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="module in modules"
          :key="module.id"
          class="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition-all duration-200"
          @click="goToModule(module.id)"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <FolderTree class="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <p class="font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                {{ module.name }}
              </p>
              <p class="text-xs text-slate-400 font-mono">{{ module.moduleKey }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="module.children?.length"
              class="text-xs text-slate-400 bg-slate-100 group-hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
            >
              {{ module.children.length }} 个子模块
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
