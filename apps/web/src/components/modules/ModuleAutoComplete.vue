<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { featureModulesApi } from '@/api/featureModules';
import type { ModuleRecommendItemDto } from '@req2task/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Sparkles, Plus, Check } from 'lucide-vue-next';

const props = defineProps<{
  projectId: string;
  requirementTitle?: string;
  requirementDescription?: string;
  selectedModuleId?: string | null;
}>();

const emit = defineEmits<{
  select: [moduleId: string | null];
  create: [name: string, description: string];
}>();

const recommendations = ref<ModuleRecommendItemDto[]>([]);
const isLoading = ref(false);
const showCreateDialog = ref(false);
const debounceTimer = ref<ReturnType<typeof setTimeout>>();

const content = computed(() => {
  return [props.requirementTitle, props.requirementDescription]
    .filter(Boolean)
    .join(' ');
});

watch(
  () => [props.requirementTitle, props.requirementDescription],
  () => {
    if (!content.value.trim()) {
      recommendations.value = [];
      return;
    }
    clearTimeout(debounceTimer.value);
    debounceTimer.value = setTimeout(fetchRecommendations, 300);
  },
  { immediate: true }
);

async function fetchRecommendations() {
  if (!content.value.trim() || !props.projectId) {
    recommendations.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const result = await featureModulesApi.recommend(props.projectId, content.value);
    recommendations.value = result.recommendations || [];
  } catch (error) {
    console.error('Failed to fetch module recommendations:', error);
    recommendations.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleSelect(item: ModuleRecommendItemDto) {
  if (item.isNew) {
    showCreateDialog.value = true;
    return;
  }
  emit('select', item.moduleId);
}

function handleCreateConfirm(name: string, description: string) {
  emit('create', name, description);
  showCreateDialog.value = false;
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function getScoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-600';
  if (score >= 0.5) return 'text-yellow-600';
  return 'text-slate-500';
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-base flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-primary" />
        模块推荐
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-3">
      <div v-if="isLoading" class="space-y-2">
        <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
      </div>

      <div v-else-if="recommendations.length > 0" class="space-y-2">
        <div
          v-for="item in recommendations"
          :key="item.isNew ? 'new' : (item.moduleId ?? 'null')"
          class="p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          :class="{
            'border-dashed border-primary/50': item.isNew,
            'border-border': !item.isNew,
            'bg-primary/5': selectedModuleId === item.moduleId,
          }"
          @click="handleSelect(item)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <Check
                v-if="selectedModuleId === item.moduleId && !item.isNew"
                class="w-4 h-4 text-primary"
              />
              <Plus v-else-if="item.isNew" class="w-4 h-4 text-primary" />
              <Layers v-else class="w-4 h-4 text-slate-400" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  v-if="!item.isNew"
                  class="font-medium text-slate-800"
                >
                  {{ item.moduleName }}
                </span>
                <Badge v-else variant="outline" class="text-primary border-primary/30">
                  创建新模块
                </Badge>

                <Badge
                  v-if="!item.isNew && item.score > 0"
                  variant="secondary"
                  :class="getScoreColor(item.score)"
                >
                  {{ formatScore(item.score) }}
                </Badge>
              </div>

              <p
                v-if="item.isNew && item.suggestedName"
                class="text-sm text-slate-500 mt-1"
              >
                建议: {{ item.suggestedName }}
              </p>
              <p
                v-else-if="item.isNew && item.suggestedDescription"
                class="text-xs text-slate-400 mt-1 line-clamp-2"
              >
                {{ item.suggestedDescription }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="content.trim()" class="text-center py-4 text-slate-400">
        <p class="text-sm">输入需求内容后将自动推荐模块</p>
      </div>

      <div v-else class="text-center py-4 text-slate-400">
        <Layers class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">请输入需求标题或描述</p>
      </div>
    </CardContent>
  </Card>

  <CreateModuleDialog
    v-model:open="showCreateDialog"
    :suggested-name="recommendations.find(r => r.isNew)?.suggestedName"
    :suggested-description="recommendations.find(r => r.isNew)?.suggestedDescription"
    @confirm="handleCreateConfirm"
  />
</template>
