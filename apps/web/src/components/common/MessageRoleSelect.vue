<script setup lang="ts">
import { MessageRole } from '@req2task/dto'
import { MESSAGE_ROLE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: MessageRole
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MessageRole]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="MESSAGE_ROLE_CONFIG"
    placeholder="消息角色"
    class="w-24 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as MessageRole)"
  />
</template>
