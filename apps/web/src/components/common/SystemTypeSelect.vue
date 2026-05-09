<script setup lang="ts">
import { SystemType } from '@req2task/dto'
import { SYSTEM_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: SystemType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SystemType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="SYSTEM_TYPE_CONFIG"
    placeholder="系统类型"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as SystemType)"
  />
</template>
