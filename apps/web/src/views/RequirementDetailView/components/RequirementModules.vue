<script setup lang="ts">
import type { RequirementResponseDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Layers } from "lucide-vue-next";

const props = defineProps<{
  requirement: RequirementResponseDto;
}>();
 
void props;
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg flex items-center gap-2">
        <FolderOpen class="w-5 h-5" />
        关联模块
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="requirement.modules && requirement.modules.length > 0" class="space-y-3">
        <div
          v-for="module in requirement.modules"
          :key="module.id"
          class="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-3">
            <Layers class="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-slate-800">{{ module.name }}</span>
                <Badge variant="outline" class="text-xs font-mono">
                  {{ module.moduleKey }}
                </Badge>
              </div>
              <p v-if="module.path" class="text-xs text-slate-500 mt-1 truncate">
                {{ module.path }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-6 text-slate-400">
        <Layers class="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p class="text-sm">暂无关联模块</p>
      </div>
    </CardContent>
  </Card>
</template>
