<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import type { UserStorySummaryDto } from "@req2task/dto";

defineProps<{
  story: UserStorySummaryDto;
  isGeneratingCriteria?: boolean;
}>();

const emit = defineEmits<{
  (e: "generate-criteria", storyId: string): void;
}>();

const criteriaTypeLabels: Record<string, string> = {
  functional: "功能验收",
  performance: "性能验收",
  security: "安全验收",
  usability: "易用性验收",
  compatibility: "兼容性验收",
  reliability: "可靠性验收",
};

const getCriteriaTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    functional: "bg-blue-100 text-blue-700 border-blue-300",
    performance: "bg-purple-100 text-purple-700 border-purple-300",
    security: "bg-red-100 text-red-700 border-red-300",
    usability: "bg-green-100 text-green-700 border-green-300",
    compatibility: "bg-orange-100 text-orange-700 border-orange-300",
    reliability: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return colors[type] || "bg-slate-100 text-slate-700 border-slate-300";
};
</script>

<template>
  <div class="p-4 border rounded-lg space-y-3">
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="outline" class="bg-purple-50">
            角色: {{ story.role }}
          </Badge>
          <Badge variant="outline" class="bg-blue-50">
            {{ story.storyPoints }} SP
          </Badge>
        </div>
        <p class="text-slate-800">
          <span class="font-medium">作为</span> {{ story.role }}
          <span class="font-medium">，我想要</span> {{ story.goal }}
          <span class="font-medium">，以便于</span> {{ story.benefit }}
        </p>
      </div>
    </div>

    <div v-if="story.acceptanceCriteria && story.acceptanceCriteria.length > 0">
      <Separator class="my-3" />
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-slate-700">验收条件:</p>
        <Button
          variant="ghost"
          size="sm"
          class="gap-1 text-xs text-blue-600 hover:text-blue-700"
          :disabled="isGeneratingCriteria"
          @click="emit('generate-criteria', story.id)"
        >
          <Loader2 v-if="isGeneratingCriteria" class="w-3 h-3 animate-spin" />
          <Sparkles v-else class="w-3 h-3" />
          AI 补充
        </Button>
      </div>
      <ul class="space-y-2">
        <li
          v-for="criteria in story.acceptanceCriteria"
          :key="criteria.id"
          class="flex items-start gap-2"
        >
          <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300" />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-700">{{ criteria.content }}</span>
              <Badge
                :class="cn('text-xs', getCriteriaTypeColor(criteria.criteriaType))"
                variant="outline"
              >
                {{ criteriaTypeLabels[criteria.criteriaType] || criteria.criteriaType }}
              </Badge>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-else class="mt-3">
      <Separator class="my-3" />
      <Button
        variant="outline"
        size="sm"
        class="gap-2"
        :disabled="isGeneratingCriteria"
        @click="emit('generate-criteria', story.id)"
      >
        <Loader2 v-if="isGeneratingCriteria" class="w-4 h-4 animate-spin" />
        <Sparkles v-else class="w-4 h-4" />
        AI 生成验收条件
      </Button>
    </div>
  </div>
</template>
