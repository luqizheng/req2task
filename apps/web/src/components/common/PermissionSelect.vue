<script setup lang="ts">
import { Permission } from '@req2task/dto'
import { PERMISSION_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: Permission
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Permission]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="PERMISSION_CONFIG"
    placeholder="权限"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as Permission)"
  />
</template>
