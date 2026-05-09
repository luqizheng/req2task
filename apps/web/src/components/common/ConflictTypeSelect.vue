<script setup lang="ts">
import { ConflictType } from '@req2task/dto'
import { CONFLICT_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: ConflictType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ConflictType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="CONFLICT_TYPE_CONFIG"
    placeholder="冲突类型"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as ConflictType)"
  />
</template>
