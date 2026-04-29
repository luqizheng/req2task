<script setup lang="ts">
import { useRouter } from "vue-router";
import type { ProjectResponseDto } from "@req2task/dto";
import { ProjectStatus } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Users,
  ArrowLeft,
} from "lucide-vue-next";
import { formatDate, getInitials } from "@/lib/utils";

defineProps<{
  project: ProjectResponseDto;
  isSettings?: boolean;
}>();

const router = useRouter();

const statusConfig: Record<ProjectStatus, { label: string; class: string }> = {
  [ProjectStatus.PLANNING]: {
    label: "规划中",
    class: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [ProjectStatus.ACTIVE]: {
    label: "进行中",
    class: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  [ProjectStatus.ON_HOLD]: {
    label: "暂停",
    class: "bg-amber-100 text-amber-700 border-amber-200",
  },
  [ProjectStatus.COMPLETED]: {
    label: "已完成",
    class: "bg-purple-100 text-purple-700 border-purple-200",
  },
  [ProjectStatus.ARCHIVED]: {
    label: "已归档",
    class: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const goBack = () => {
  router.push("/projects");
};
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button v-if="isSettings" variant="ghost" size="icon" @click="goBack">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <CardTitle>{{ isSettings ? "项目设置" : "项目信息" }}</CardTitle>
        </div>
        <Badge
          :class="statusConfig[project.status]?.class"
          variant="outline"
        >
          {{ statusConfig[project.status]?.label || project.status }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="grid grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-500">项目名称</label>
            <p class="text-base text-slate-800">{{ project.name }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">项目描述</label>
            <p class="text-base text-slate-800">
              {{ project.description || "暂无描述" }}
            </p>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">项目标识</label>
            <p class="text-base text-slate-800 font-mono">{{ project.projectKey }}</p>
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-slate-400" />
            <div>
              <label class="text-sm font-medium text-slate-500">项目周期</label>
              <p class="text-base text-slate-800">
                {{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}
              </p>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">创建时间</label>
            <p class="text-base text-slate-800">{{ formatDate(project.createdAt) }}</p>
          </div>
        </div>
      </div>

      <div class="border-t pt-4">
        <div class="flex items-center gap-2 mb-3">
          <Users class="w-4 h-4 text-slate-400" />
          <label class="text-sm font-medium text-slate-500">
            项目成员 ({{ project.members?.length || 0 }})
          </label>
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg"
          >
            <Avatar class="w-6 h-6">
              <AvatarFallback class="text-xs">
                {{ getInitials(member.displayName || member.username) }}
              </AvatarFallback>
            </Avatar>
            <span class="text-sm text-slate-700">{{ member.displayName || member.username }}</span>
          </div>
          <div v-if="!project.members?.length" class="text-sm text-slate-400">
            暂无成员
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
