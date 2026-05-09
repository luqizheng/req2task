<script setup lang="ts">
import { ConversationStatus } from '@req2task/dto'
import { CONVERSATION_STATUS_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: ConversationStatus
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ConversationStatus]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="CONVERSATION_STATUS_CONFIG"
    placeholder="对话状态"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as ConversationStatus)"
  />
</template>
