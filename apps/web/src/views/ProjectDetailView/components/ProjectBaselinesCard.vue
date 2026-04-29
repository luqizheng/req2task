<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitBranch,
  Plus,
  Clock,
  User,
} from "lucide-vue-next";
import { projectsApi } from "@/api/projects";
import { formatDateTime } from "@/lib/utils";
import type { BaselineDto } from "@/api/projects";

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const baselines = ref<BaselineDto[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchBaselines = async () => {
  try {
    loading.value = true;
    const response = await projectsApi.getBaselines(props.projectId);
    baselines.value = response;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载基线失败";
  } finally {
    loading.value = false;
  }
};

const goToBaseline = (baselineId: string) => {
  router.push(`/projects/${props.projectId}/baselines/${baselineId}`);
};

onMounted(() => {
  fetchBaselines();
});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <GitBranch class="w-5 h-5" />
          项目基线
        </CardTitle>
        <Button size="sm">
          <Plus class="w-4 h-4 mr-2" />
          创建基线
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-20 w-full" />
      </div>

      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>

      <div v-else-if="baselines.length === 0" class="text-center py-12 text-slate-400">
        暂无基线
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="baseline in baselines"
          :key="baseline.id"
          class="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          @click="goToBaseline(baseline.id)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <GitBranch class="w-4 h-4 text-slate-400" />
                <h4 class="font-medium text-slate-800">{{ baseline.name }}</h4>
              </div>
              <p v-if="baseline.description" class="text-sm text-slate-500 mb-3">
                {{ baseline.description }}
              </p>
              <div class="flex items-center gap-4 text-xs text-slate-400">
                <span class="flex items-center gap-1">
                  <User class="w-3 h-3" />
                  {{ baseline.createdBy.name }}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ formatDateTime(baseline.createdAt) }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm">对比</Button>
              <Button variant="outline" size="sm">恢复</Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
