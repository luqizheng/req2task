<script setup lang="ts">
import type { ProjectProgressDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
} from "lucide-vue-next";

defineProps<{
  progress: ProjectProgressDto;
}>();

const formatPercent = (value: number) => {
  return `${Math.round(value)}%`;
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <BarChart3 class="w-5 h-5" />
        项目进度
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Target class="w-4 h-4 text-blue-600" />
            <span class="text-sm font-medium text-blue-700">需求进度</span>
          </div>
          <div class="text-2xl font-bold text-blue-800 mb-2">
            {{ formatPercent(progress.requirementProgress) }}
          </div>
          <Progress :model-value="progress.requirementProgress" class="h-2" />
          <div class="text-xs text-blue-600 mt-2">
            {{ progress.completedRequirements }} / {{ progress.totalRequirements }} 已完成
          </div>
        </div>

        <div class="p-4 bg-emerald-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span class="text-sm font-medium text-emerald-700">任务进度</span>
          </div>
          <div class="text-2xl font-bold text-emerald-800 mb-2">
            {{ formatPercent(progress.taskProgress) }}
          </div>
          <Progress :model-value="progress.taskProgress" class="h-2" />
          <div class="text-xs text-emerald-600 mt-2">
            {{ progress.completedTasks }} / {{ progress.totalTasks }} 已完成
          </div>
        </div>

        <div class="p-4 bg-purple-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Clock class="w-4 h-4 text-purple-600" />
            <span class="text-sm font-medium text-purple-700">工时统计</span>
          </div>
          <div class="text-2xl font-bold text-purple-800 mb-2">
            {{ progress.totalActualHours }}h
          </div>
          <div class="text-xs text-purple-600 mt-1">
            预估: {{ progress.totalEstimatedHours }}h
          </div>
          <div class="text-xs text-purple-600">
            故事点: {{ progress.completedStoryPoints }} / {{ progress.totalStoryPoints }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="border rounded-lg p-4">
          <h4 class="text-sm font-medium text-slate-700 mb-3">需求状态分布</h4>
          <div class="space-y-2">
            <div
              v-for="(count, status) in progress.byRequirementStatus"
              :key="status"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-600">{{ status }}</span>
              <span class="font-medium text-slate-800">{{ count }}</span>
            </div>
          </div>
        </div>

        <div class="border rounded-lg p-4">
          <h4 class="text-sm font-medium text-slate-700 mb-3">任务状态分布</h4>
          <div class="space-y-2">
            <div
              v-for="(count, status) in progress.byTaskStatus"
              :key="status"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-slate-600">{{ status }}</span>
              <span class="font-medium text-slate-800">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
