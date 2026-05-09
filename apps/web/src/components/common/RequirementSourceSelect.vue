<script setup lang="ts">
import { RequirementSource } from '@req2task/dto'
import { REQUIREMENT_SOURCE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: RequirementSource
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RequirementSource]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="REQUIREMENT_SOURCE_CONFIG"
    placeholder="需求来源"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as RequirementSource)"
  />
</template>
