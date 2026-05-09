<script setup lang="ts">
import { DatabaseType } from '@req2task/dto'
import { DATABASE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: DatabaseType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DatabaseType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="DATABASE_TYPE_CONFIG"
    placeholder="数据库类型"
    class="w-36 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as DatabaseType)"
  />
</template>
