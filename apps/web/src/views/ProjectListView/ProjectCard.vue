<script setup lang="ts">
import { useRouter } from "vue-router";
import type { ProjectResponseDto } from "@req2task/dto";
import { MoreHorizontal, FolderKanban, Calendar, Users, Settings } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import CommonCard from "@/components/CommonCard.vue";
import EnumBadge from "@/components/common/EnumBadge.vue";
import { PROJECT_STATUS_CONFIG } from "@/utils/enum-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

defineProps<{
  project: ProjectResponseDto;
}>();

const router = useRouter();

const goToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const formatDate = (date: Date | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>

<template>
  <CommonCard
    class="group border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
    :title="project.name"
    @click="goToProject(project.id)"
  >
    <template #title-icon>
      <div
        class="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0"
      >
        <FolderKanban class="w-4 h-4 text-white" />
      </div>
    </template>
    <template #actions>
      <DropdownMenu>
        <DropdownMenuTrigger as-child @click.stop>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click.stop="goToProject(project.id)">
            查看详情
          </DropdownMenuItem>
          <DropdownMenuItem
            @click.stop="router.push(`/projects/${project.id}/settings`)"
          >
            <Settings class="w-4 h-4 mr-2" />
            项目设置
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-red-600">删除项目</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>
    <div class="space-y-3">
      <p v-if="project.description" class="text-sm text-slate-500 line-clamp-2">
        {{ project.description }}
      </p>
      <p v-else class="text-sm text-slate-400 italic">暂无描述</p>
      <div class="flex items-center justify-between">
        <EnumBadge :value="project.status" :config="PROJECT_STATUS_CONFIG" class="text-xs" />
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <Calendar class="w-3 h-3" />
            {{ formatDate(project.startDate) }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1 pt-2 border-t border-slate-100">
        <Users class="w-3 h-3 text-slate-400" />
        <span class="text-xs text-slate-500">{{ project.members?.length || 0 }} 位成员</span>
        <span class="text-slate-300 mx-1">·</span>
        <span class="text-xs text-slate-400 font-mono">{{ project.projectKey }}</span>
      </div>
    </div>
  </CommonCard>
</template>