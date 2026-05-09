<script setup lang="ts">
import { ChangeType } from '@req2task/dto'
import { CHANGE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: ChangeType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ChangeType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="CHANGE_TYPE_CONFIG"
    placeholder="变更类型"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as ChangeType)"
  />
</template>
