<script setup lang="ts">

import type { ConflictDto } from "@req2task/dto";
import { ConflictType } from "@req2task/dto";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-vue-next";

const props = defineProps<{
  conflicts: ConflictDto[];
  isLoading?: boolean;
}>();
 
void props;

const emit = defineEmits<{
  (e: "resolve", conflict: ConflictDto): void;
  (e: "view-detail", conflict: ConflictDto): void;
}>();

const conflictTypeConfig: Record<ConflictType, { label: string; class: string }> = {
  [ConflictType.LOGICAL]: { label: "逻辑冲突", class: "bg-red-100 text-red-700 border-red-300" },
  [ConflictType.TEMPORAL]: { label: "时序冲突", class: "bg-orange-100 text-orange-700 border-orange-300" },
  [ConflictType.FUNCTIONAL]: { label: "功能冲突", class: "bg-purple-100 text-purple-700 border-purple-300" },
  [ConflictType.RESOURCE]: { label: "资源冲突", class: "bg-yellow-100 text-yellow-700 border-yellow-300" },
};

// getConflictIcon is reserved for future use
// const getConflictIcon = (type: ConflictType) => {
//   const icons: Record<ConflictType, string> = {
//     [ConflictType.LOGICAL]: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
//     [ConflictType.TEMPORAL]: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
//     [ConflictType.FUNCTIONAL]: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
//     [ConflictType.RESOURCE]: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
//   };
//   return icons[type] || icons[ConflictType.LOGICAL];
// };
</script>

<template>
  <div v-if="conflicts.length > 0" class="space-y-4">
    <Alert
      variant="destructive"
      class="border-red-300 bg-red-50"
    >
      <AlertTriangle class="w-5 h-5" />
      <AlertTitle class="text-red-800 flex items-center gap-2">
        检测到需求冲突
        <Badge variant="outline" class="bg-red-100 text-red-700 border-red-300">
          {{ conflicts.length }} 个冲突
        </Badge>
      </AlertTitle>
      <AlertDescription class="text-red-700 mt-2">
        当前需求与其他需求存在冲突，请查看详情并进行处理。
      </AlertDescription>
    </Alert>

    <div class="space-y-3">
      <div
        v-for="(conflict, index) in conflicts"
        :key="index"
        class="border border-red-200 rounded-lg p-4 bg-white hover:bg-red-50/50 transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 space-y-3">
            <div class="flex items-center gap-2 flex-wrap">
              <Badge
                :class="conflictTypeConfig[conflict.type]?.class"
                variant="outline"
              >
                {{ conflictTypeConfig[conflict.type]?.label || conflict.type }}
              </Badge>
            </div>

            <p class="text-sm text-slate-700">
              {{ conflict.description }}
            </p>

            <div class="bg-slate-50 rounded-md p-3 space-y-2">
              <p class="text-xs font-medium text-slate-600 mb-1">冲突需求:</p>
              <div class="space-y-1 text-xs">
                <div class="flex items-start gap-2">
                  <span class="text-slate-500">需求1:</span>
                  <span class="text-slate-700 flex-1">{{ conflict.requirement1.content }}</span>
                </div>
                <div class="flex items-center gap-2 px-2">
                  <ArrowRight class="w-3 h-3 text-slate-400" />
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-slate-500">需求2:</span>
                  <span class="text-slate-700 flex-1">{{ conflict.requirement2.content }}</span>
                </div>
              </div>
            </div>

            <div class="bg-blue-50 rounded-md p-3">
              <div class="flex items-start gap-2">
                <Lightbulb class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div class="flex-1">
                  <p class="text-xs font-medium text-blue-700 mb-1">建议处理方式:</p>
                  <p class="text-xs text-blue-600">
                    {{ conflict.suggestion }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            class="h-7 text-xs"
            @click="emit('view-detail', conflict)"
          >
            查看详情
          </Button>
          <Button
            size="sm"
            variant="default"
            class="h-7 text-xs bg-blue-500 hover:bg-blue-600"
            @click="emit('resolve', conflict)"
          >
            处理冲突
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
