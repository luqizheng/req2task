<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle } from "lucide-vue-next";
import type { UserStoryDraft } from "@/api/ai";

defineProps<{
  story: UserStoryDraft;
  selected: boolean;
}>();

defineEmits<{
  (e: "toggle"): void;
}>();
</script>

<template>
  <div
    :class="[
      'p-4 border rounded-lg cursor-pointer transition-colors',
      selected
        ? 'border-blue-500 bg-blue-50'
        : 'border-slate-200 bg-white hover:border-slate-300'
    ]"
    @click="$emit('toggle')"
  >
    <div class="flex items-start gap-3">
      <div
        :class="[
          'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
          selected
            ? 'bg-blue-500 border-blue-500'
            : 'border-slate-300'
        ]"
      >
        <CheckCircle2
          v-if="selected"
          class="w-4 h-4 text-white"
        />
        <Circle
          v-else
          class="w-4 h-4 text-slate-400"
        />
      </div>
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
        <div
          v-if="story.acceptanceCriteria && story.acceptanceCriteria.length > 0"
          class="mt-3"
        >
          <Separator class="my-2" />
          <p class="text-xs font-medium text-slate-500 mb-1">验收条件:</p>
          <ul class="space-y-1">
            <li
              v-for="(criteria, cIndex) in story.acceptanceCriteria"
              :key="cIndex"
              class="flex items-start gap-2"
            >
              <CheckCircle2 class="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-300" />
              <span class="text-xs text-slate-600">{{ criteria.content }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
