<script setup lang="ts">
import { Priority } from '@req2task/dto'
import { PRIORITY_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: Priority
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Priority]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="PRIORITY_CONFIG"
    placeholder="优先级"
    class="w-24 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as Priority)"
  />
</template>
