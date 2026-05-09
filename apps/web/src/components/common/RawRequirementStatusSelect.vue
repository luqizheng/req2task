<script setup lang="ts">
import { RawRequirementStatus } from '@req2task/dto'
import { RAW_REQUIREMENT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: RawRequirementStatus
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RawRequirementStatus]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="RAW_REQUIREMENT_STATUS_CONFIG"
    placeholder="原始需求状态"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as RawRequirementStatus)"
  />
</template>
