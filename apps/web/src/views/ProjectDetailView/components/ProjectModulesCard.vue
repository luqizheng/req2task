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
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <FolderTree class="w-5 h-5" />
          功能模块
        </CardTitle>
        <Button size="sm">
          <Plus class="w-4 h-4 mr-2" />
          新建模块
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="modules.length === 0" class="text-center py-12 text-slate-400">
        暂无功能模块
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="module in modules"
          :key="module.id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          @click="goToModule(module.id)"
        >
          <div class="flex items-center gap-3">
            <FolderTree class="w-4 h-4 text-slate-400" />
            <div>
              <p class="font-medium text-slate-800">{{ module.name }}</p>
              <p class="text-xs text-slate-500">{{ module.moduleKey }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">
              {{ module.children?.length || 0 }} 个子模块
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
