<script setup lang="ts">
import { RequirementStatus } from '@req2task/dto'
import { REQUIREMENT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: RequirementStatus
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RequirementStatus]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="REQUIREMENT_STATUS_CONFIG"
    placeholder="需求状态"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as RequirementStatus)"
  />
</template>
