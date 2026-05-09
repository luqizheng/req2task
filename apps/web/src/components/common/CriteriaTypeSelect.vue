<script setup lang="ts">
import { CriteriaType } from '@req2task/dto'
import { CRITERIA_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: CriteriaType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CriteriaType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="CRITERIA_TYPE_CONFIG"
    placeholder="验收标准类型"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as CriteriaType)"
  />
</template>
