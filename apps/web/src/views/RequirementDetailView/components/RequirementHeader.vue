<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { RequirementResponseDto } from "@req2task/dto";
import { RequirementStatus, Priority } from "@req2task/dto";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { REQUIREMENT_STATUS_CONFIG, PRIORITY_CONFIG, getEnumLabel } from "@/utils/enum-config";

const props = defineProps<{
  requirement: RequirementResponseDto;
  projectId: string;
  allowedTransitions?: Array<{ to: string; label: string; color: string }>;
  isTransitioning?: boolean;
}>();

const emit = defineEmits<{
  (e: "title-update", title: string): void;
  (e: "status-change", status: RequirementStatus): void;
}>();

const isEditing = ref(false);
const editedTitle = ref(props.requirement.title);
const editInputRef = ref<{ $el: HTMLInputElement } | null>(null);

watch(() => props.requirement.title, (newTitle) => {
  editedTitle.value = newTitle;
});

const startEditing = async () => {
  editedTitle.value = props.requirement.title;
  isEditing.value = true;
  await nextTick();
  editInputRef.value?.$el?.focus();
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

const handleStatusChange = (newStatus: unknown) => {
  if (typeof newStatus === 'string' && newStatus !== props.requirement.status) {
    emit("status-change", newStatus as RequirementStatus);
  }
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
            ref="editInputRef"
            v-model="editedTitle"
            class="text-2xl font-bold"
            @keyup.enter="saveTitle"
            @keyup.escape="cancelEditing"
          />
        </div>
        <div
          v-else
          class="group flex items-center gap-3 cursor-pointer"
          @click="startEditing"
        >
          <h1 class="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {{ requirement.title }}
          </h1>
        </div>

        <div class="flex items-center gap-2 mt-2">
          <Badge
            variant="outline"
            class="border-status-draft text-status-draft hover:bg-status-draft hover:text-white"
            :class="{
              'border-priority-critical text-priority-critical hover:bg-priority-critical': requirement.priority === Priority.CRITICAL,
              'border-priority-high text-priority-high hover:bg-priority-high': requirement.priority === Priority.HIGH,
              'border-priority-medium text-priority-medium hover:bg-priority-medium': requirement.priority === Priority.MEDIUM,
              'border-priority-low text-priority-low hover:bg-priority-low': requirement.priority === Priority.LOW,
            }"
          >
            {{ getEnumLabel(PRIORITY_CONFIG, requirement.priority) }}
          </Badge>
     
          <ButtonGroup>
            <Button
              variant="outline"
              size="sm"
              disabled
              :class="[
                'justify-start border-2 border-status-draft text-primary bg-primary/30 font-medium',
                requirement.status === RequirementStatus.REVIEWED && 'border-2 border-status-reviewed text-primary bg-primary/20 font-medium',
                requirement.status === RequirementStatus.APPROVED && 'border-2 border-status-approved text-primary bg-primary/20 font-medium',
                requirement.status === RequirementStatus.REJECTED && 'border-2 border-status-rejected text-primary bg-primary/20 font-medium',
                requirement.status === RequirementStatus.PROCESSING && 'border-2 border-status-processing text-primary bg-primary/20 font-medium',
                requirement.status === RequirementStatus.COMPLETED && 'border-2 border-status-completed text-primary bg-primary/20 font-medium',
                requirement.status === RequirementStatus.CANCELLED && 'border-2 border-status-cancelled text-primary bg-primary/20 font-medium',
              ]"
            >
              {{ getEnumLabel(REQUIREMENT_STATUS_CONFIG, requirement.status) }}
            </Button>
         
            <Button
              v-for="transition in allowedTransitions"
              :key="transition.to"
              variant="outline"
              size="sm"
              class="justify-start"
              :disabled="isTransitioning"
              @click="handleStatusChange(transition.to)"
            >
        
              <span
                class="w-2 h-2 rounded-full mr-1.5"
                :style="{ backgroundColor: transition.color }"
              />
              {{ transition.label }}
            </Button>
          </ButtonGroup>
          <span class="text-sm text-muted-foreground ml-2">
            {{ requirement.storyPoints }} SP
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
