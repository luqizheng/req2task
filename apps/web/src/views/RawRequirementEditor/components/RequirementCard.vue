<template>
  <div class="rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {{ props.index + 1 }}
        </div>
        <h3 class="text-sm font-semibold text-foreground truncate">
          {{ props.requirement.title }}
        </h3>
      </div>
      <Badge
        :variant="priorityVariant"
        class="text-xs h-5 shrink-0"
      >
        {{ priorityLabel }}
      </Badge>
    </div>

    <!-- Description -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
      {{ props.requirement.content }}
    </p>

    <!-- Tags -->
    <div class="flex flex-wrap gap-1.5">
      <Badge
        v-for="tag in displayTags"
        :key="tag"
        variant="secondary"
        class="text-[10px] h-5 px-1.5"
      >
        {{ tag }}
      </Badge>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Priority, RawRequirementResponseDto } from "@req2task/dto";

interface Props {
  requirement: RawRequirementResponseDto;
  index: number;
  tags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
});

const priorityVariant = computed(() => {
  const variantMap: Record<Priority, "default" | "secondary" | "destructive" | "outline"> = {
    critical: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
  };
  return variantMap[(props.requirement.priority as Priority) || Priority.LOW];
});

const priorityLabel = computed(() => {
  const labelMap: Record<Priority, string> = {
    critical: "高优先级",
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级",
  };
  return labelMap[(props.requirement.priority as Priority) || Priority.LOW];
});

const displayTags = computed(() => {
  return props.tags.length > 0 ? props.tags : ["需求"];
});
</script>
