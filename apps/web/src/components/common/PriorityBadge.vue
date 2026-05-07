<script setup lang="ts">
import { TaskPriority } from "@req2task/dto";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

defineProps<{
  priority: TaskPriority;
}>();

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: "紧急",
  [TaskPriority.HIGH]: "高",
  [TaskPriority.MEDIUM]: "中",
  [TaskPriority.LOW]: "低",
};

const getPriorityClass = (priority: TaskPriority) => {
  return cn(
    "text-xs",
    priority === TaskPriority.URGENT
      ? "bg-destructive/15 text-destructive"
      : priority === TaskPriority.HIGH
        ? "bg-primary/15 text-primary"
        : priority === TaskPriority.MEDIUM
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-muted-foreground",
  );
};
</script>

<template>
  <Badge :class="getPriorityClass(priority)">
    {{ priorityLabels[priority] }}
  </Badge>
</template>
