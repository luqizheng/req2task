<script setup lang="ts">
import { useRouter } from "vue-router";
import type { ProjectResponseDto } from "@req2task/dto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnumBadge from "@/components/common/EnumBadge.vue";
import { PROJECT_STATUS_CONFIG } from "@/utils/enum-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Users,
  ArrowLeft,
  FileText,
  Key,
  Clock,
  Settings,
  Plus,
} from "lucide-vue-next";
import { formatDate, getInitials } from "@/lib/utils";

defineProps<{
  project: ProjectResponseDto;
  isSettings?: boolean;
}>();

const router = useRouter();

const goBack = () => {
  router.push("/projects");
};
</script>

<template>
  <Card class="border-slate-200 shadow-sm overflow-hidden">
    <CardHeader class="pb-4 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button
            v-if="isSettings"
            variant="ghost"
            size="icon"
            class="hover:bg-slate-200"
            @click="goBack"
          >
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Settings v-if="isSettings" class="w-4 h-4 text-blue-600" />
            <FileText v-else class="w-4 h-4 text-blue-600" />
          </div>
          <CardTitle class="text-slate-800">
            {{ isSettings ? "项目设置" : "项目信息" }}
          </CardTitle>
        </div>
        <EnumBadge :value="project.status" :config="PROJECT_STATUS_CONFIG" show-dot />
      </div>
    </CardHeader>
    <CardContent class="p-6">
      <div class="grid grid-cols-2 gap-8">
        <div class="space-y-5">
          <div class="group">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <FileText class="w-3.5 h-3.5" />
              项目名称
            </label>
            <p class="text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
              {{ project.name }}
            </p>
          </div>

          <div class="group">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Key class="w-3.5 h-3.5" />
              项目标识
            </label>
            <p class="text-base font-mono text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md inline-block">
              {{ project.projectKey }}
            </p>
          </div>

          <div class="group">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <FileText class="w-3.5 h-3.5" />
              项目描述
            </label>
            <p class="text-sm text-slate-600 leading-relaxed">
              {{ project.description || "暂无描述" }}
            </p>
          </div>
        </div>

        <div class="space-y-5">
          <div class="group">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Calendar class="w-3.5 h-3.5" />
              项目周期
            </label>
            <p class="text-sm text-slate-700">
              {{ formatDate(project.startDate) }}
              <span class="text-slate-400 mx-2">—</span>
              {{ formatDate(project.endDate) }}
            </p>
          </div>

          <div class="group">
            <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Clock class="w-3.5 h-3.5" />
              创建时间
            </label>
            <p class="text-sm text-slate-700">
              {{ formatDate(project.createdAt) }}
            </p>
          </div>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <label class="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5" />
            项目成员
            <span class="ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-xs">
              {{ project.members?.length || 0 }}
            </span>
          </label>
          <Button variant="ghost" size="sm" class="text-slate-500 hover:text-slate-700">
            <Plus class="w-4 h-4 mr-1" />
            添加成员
          </Button>
        </div>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="member in project.members"
            :key="member.id"
            class="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
          >
            <Avatar class="w-7 h-7 ring-2 ring-slate-100">
              <AvatarFallback class="text-xs bg-blue-50 text-blue-600 font-medium">
                {{ getInitials(member.displayName || member.username) }}
              </AvatarFallback>
            </Avatar>
            <span class="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              {{ member.displayName || member.username }}
            </span>
          </div>

          <div
            v-if="!project.members?.length"
            class="w-full text-center py-8 text-slate-400"
          >
            <Users class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无成员</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
