<script setup lang="ts">
import { TaskPriority } from "@req2task/dto";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

defineProps<{
  modelValue?: TaskPriority;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: TaskPriority];
}>();

const handleValueChange = (value: string) => {
  emit("update:modelValue", value as TaskPriority);
};
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="handleValueChange">
    <SelectTrigger class="w-28 h-7 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="low">低</SelectItem>
      <SelectItem value="medium">中</SelectItem>
      <SelectItem value="high">高</SelectItem>
      <SelectItem value="urgent">紧急</SelectItem>
    </SelectContent>
  </Select>
</template>
