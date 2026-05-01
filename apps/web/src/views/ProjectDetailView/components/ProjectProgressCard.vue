<script setup lang="ts">
import type { ProjectProgressDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
} from "lucide-vue-next";

defineProps<{
  progress: ProjectProgressDto;
}>();

const formatPercent = (value: number) => {
  return `${Math.round(value)}%`;
};

const formatHours = (value: number) => {
  return Math.round(value);
};

</script>

<template>
  <Card class="border-slate-200 shadow-sm overflow-hidden">
    <CardHeader class="pb-4 border-b border-slate-100 bg-slate-50/50">
      <CardTitle class="flex items-center gap-2 text-slate-800">
        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <BarChart3 class="w-4 h-4 text-blue-600" />
        </div>
        <span class="font-semibold">项目进度概览</span>
      </CardTitle>
    </CardHeader>
    <CardContent class="p-6">
      <div class="grid grid-cols-3 gap-5">
        <div class="group relative p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100/50 hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Target class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-medium text-blue-700">需求进度</span>
            </div>
            <TrendingUp class="w-4 h-4 text-blue-400" />
          </div>
          <div class="flex items-baseline gap-2 mb-3">
            <div class="text-3xl font-bold text-blue-900 tabular-nums">
              {{ formatPercent(progress.requirementProgress) }}
            </div>
            <span class="text-sm text-blue-600">完成率</span>
          </div>
          <Progress
            :model-value="progress.requirementProgress"
            class="h-2.5 bg-blue-200/50 [&>div]:transition-all"
          />
          <div class="flex items-center justify-between mt-3 text-xs text-blue-600/80">
            <span>{{ progress.completedRequirements }} 已完成</span>
            <span>{{ progress.totalRequirements }} 总计</span>
          </div>
        </div>

        <div class="group relative p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100/50 hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span class="text-sm font-medium text-emerald-700">任务进度</span>
            </div>
            <TrendingUp class="w-4 h-4 text-emerald-400" />
          </div>
          <div class="flex items-baseline gap-2 mb-3">
            <div class="text-3xl font-bold text-emerald-900 tabular-nums">
              {{ formatPercent(progress.taskProgress) }}
            </div>
            <span class="text-sm text-emerald-600">完成率</span>
          </div>
          <Progress
            :model-value="progress.taskProgress"
            class="h-2.5 bg-emerald-200/50 [&>div]:transition-all"
          />
          <div class="flex items-center justify-between mt-3 text-xs text-emerald-600/80">
            <span>{{ progress.completedTasks }} 已完成</span>
            <span>{{ progress.totalTasks }} 总计</span>
          </div>
        </div>

        <div class="group relative p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100/50 hover:shadow-md transition-all duration-200">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-purple-600" />
              <span class="text-sm font-medium text-purple-700">工时统计</span>
            </div>
          </div>
          <div class="flex items-baseline gap-2 mb-3">
            <div class="text-3xl font-bold text-purple-900 tabular-nums">
              {{ formatHours(progress.totalActualHours) }}
            </div>
            <span class="text-sm text-purple-600">小时</span>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-purple-600/70">预估工时</span>
              <span class="font-medium text-purple-700">{{ formatHours(progress.totalEstimatedHours) }}h</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-purple-600/70">故事点</span>
              <span class="font-medium text-purple-700">
                {{ progress.completedStoryPoints }} / {{ progress.totalStoryPoints }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-5 mt-5">
        <div class="rounded-xl border border-slate-200 bg-slate-50/30 p-5">
          <h4 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 rounded-full bg-blue-500" />
            需求状态分布
          </h4>
          <div class="space-y-3">
            <div
              v-for="(count, status) in progress.byRequirementStatus"
              :key="status"
              class="flex items-center justify-between text-sm group"
            >
              <span class="text-slate-600 group-hover:text-slate-800 transition-colors">{{ status }}</span>
              <span class="px-2 py-0.5 bg-white rounded-md font-medium text-slate-700 text-xs shadow-sm">
                {{ count }}
              </span>
            </div>
            <div
              v-if="Object.keys(progress.byRequirementStatus).length === 0"
              class="text-sm text-slate-400 text-center py-4"
            >
              暂无数据
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50/30 p-5">
          <h4 class="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span class="w-1.5 h-4 rounded-full bg-emerald-500" />
            任务状态分布
          </h4>
          <div class="space-y-3">
            <div
              v-for="(count, status) in progress.byTaskStatus"
              :key="status"
              class="flex items-center justify-between text-sm group"
            >
              <span class="text-slate-600 group-hover:text-slate-800 transition-colors">{{ status }}</span>
              <span class="px-2 py-0.5 bg-white rounded-md font-medium text-slate-700 text-xs shadow-sm">
                {{ count }}
              </span>
            </div>
            <div
              v-if="Object.keys(progress.byTaskStatus).length === 0"
              class="text-sm text-slate-400 text-center py-4"
            >
              暂无数据
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
