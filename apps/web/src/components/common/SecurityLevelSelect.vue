<script setup lang="ts">
import { SecurityLevel } from '@req2task/dto'
import { SECURITY_LEVEL_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: SecurityLevel
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SecurityLevel]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="SECURITY_LEVEL_CONFIG"
    placeholder="安全等级"
    class="w-24 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as SecurityLevel)"
  />
</template>
