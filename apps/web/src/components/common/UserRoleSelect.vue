<script setup lang="ts">
import { UserRole } from '@req2task/dto'
import { USER_ROLE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: UserRole
}>()

const emit = defineEmits<{
  'update:modelValue': [value: UserRole]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="USER_ROLE_CONFIG"
    placeholder="用户角色"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as UserRole)"
  />
</template>
