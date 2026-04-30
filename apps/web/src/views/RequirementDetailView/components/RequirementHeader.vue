<script setup lang="ts">
import { ref, watch } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { RequirementStatus, Priority } from "@req2task/dto";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const props = defineProps<{
  requirement: RequirementResponseDto;
  projectId: string;
}>();

const emit = defineEmits<{
  (e: "title-update", title: string): void;
}>();

const isEditing = ref(false);
const editedTitle = ref(props.requirement.title);

watch(() => props.requirement.title, (newTitle) => {
  editedTitle.value = newTitle;
});

const startEditing = () => {
  editedTitle.value = props.requirement.title;
  isEditing.value = true;
};

const saveTitle = () => {
  if (editedTitle.value.trim() && editedTitle.value !== props.requirement.title) {
    emit("title-update", editedTitle.value.trim());
  }
  isEditing.value = false;
};

const cancelEditing = () => {
  editedTitle.value = props.requirement.title;
  isEditing.value = false;
};

const statusConfig: Record<RequirementStatus, { label: string; class: string }> = {
  [RequirementStatus.DRAFT]: { label: "草稿", class: "bg-slate-100 text-slate-700 border-slate-300" },
  [RequirementStatus.REVIEWED]: { label: "已审核", class: "bg-blue-100 text-blue-700 border-blue-300" },
  [RequirementStatus.APPROVED]: { label: "已批准", class: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  [RequirementStatus.REJECTED]: { label: "已拒绝", class: "bg-red-100 text-red-700 border-red-300" },
  [RequirementStatus.PROCESSING]: { label: "进行中", class: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  [RequirementStatus.COMPLETED]: { label: "已完成", class: "bg-purple-100 text-purple-700 border-purple-300" },
  [RequirementStatus.CANCELLED]: { label: "已取消", class: "bg-slate-100 text-slate-600 border-slate-300" },
};

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  [Priority.CRITICAL]: { label: "关键", class: "bg-red-500 text-white border-red-600" },
  [Priority.HIGH]: { label: "高", class: "bg-orange-500 text-white border-orange-600" },
  [Priority.MEDIUM]: { label: "中", class: "bg-yellow-500 text-white border-yellow-600" },
  [Priority.LOW]: { label: "低", class: "bg-slate-500 text-white border-slate-600" },
};
</script>

<template>
  <div class="space-y-4">
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink :href="`/projects/${projectId}`">
            项目
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink :href="`/projects/${projectId}`">
            需求列表
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage class="font-medium">
            {{ requirement.entityKey }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <div v-if="isEditing" class="flex items-center gap-2">
          <Input
            v-model="editedTitle"
            class="text-2xl font-bold"
            @keyup.enter="saveTitle"
            @keyup.escape="cancelEditing"
          />
          <Badge
            :class="priorityConfig[requirement.priority]?.class"
            variant="outline"
          >
            {{ priorityConfig[requirement.priority]?.label }}
          </Badge>
          <Badge
            :class="statusConfig[requirement.status]?.class"
            variant="outline"
          >
            {{ statusConfig[requirement.status]?.label }}
          </Badge>
        </div>
        <div
          v-else
          class="group flex items-center gap-3 cursor-pointer"
          @click="startEditing"
        >
          <h1 class="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {{ requirement.title }}
          </h1>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <Badge
            :class="priorityConfig[requirement.priority]?.class"
            variant="outline"
          >
            {{ priorityConfig[requirement.priority]?.label }}
          </Badge>
          <Badge
            :class="statusConfig[requirement.status]?.class"
            variant="outline"
          >
            {{ statusConfig[requirement.status]?.label }}
          </Badge>
          <span class="text-sm text-slate-500 ml-2">
            {{ requirement.storyPoints }} SP
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
