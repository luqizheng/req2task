<script setup lang="ts">
import { TaskStatus } from '@req2task/dto'
import { TASK_STATUS_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: TaskStatus
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TaskStatus]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="TASK_STATUS_CONFIG"
    placeholder="任务状态"
    class="w-24 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as TaskStatus)"
  />
</template>
