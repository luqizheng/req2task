<script setup lang="ts">
import { computed } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusOption {
  value: string;
  label: string;
}

const props = defineProps<{
  modelValue?: string;
  options?: StatusOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const statusOptions: StatusOption[] = [
  { value: "planning", label: "规划中" },
  { value: "active", label: "进行中" },
  { value: "on_hold", label: "暂停" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" },
];

const displayOptions = computed(() => props.options || statusOptions);
const displayValue = computed(() => props.modelValue || "all");

const handleChange = (value: unknown) => {
  const val = String(value ?? "all");
  emit("update:modelValue", val === "all" ? "" : val);
};
</script>

<template>
  <Select :model-value="displayValue" @update:model-value="handleChange">
    <SelectTrigger class="w-[140px]">
      <SelectValue placeholder="项目状态" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">全部状态</SelectItem>
      <SelectItem
        v-for="opt in displayOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>