<script setup lang="ts">
import { ArchitectureType } from '@req2task/dto'
import { ARCHITECTURE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: ArchitectureType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ArchitectureType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="ARCHITECTURE_TYPE_CONFIG"
    placeholder="架构类型"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as ArchitectureType)"
  />
</template>
