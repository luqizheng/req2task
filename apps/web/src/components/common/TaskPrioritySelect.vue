<script setup lang="ts">
import { TaskPriority } from '@req2task/dto'
import { TASK_PRIORITY_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: TaskPriority
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskPriority]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="TASK_PRIORITY_CONFIG"
    placeholder="优先级"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as TaskPriority)"
  />
</template>
