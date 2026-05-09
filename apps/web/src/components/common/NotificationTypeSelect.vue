<script setup lang="ts">
import { NotificationType } from '@req2task/dto'
import { NOTIFICATION_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: NotificationType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: NotificationType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="NOTIFICATION_TYPE_CONFIG"
    placeholder="通知类型"
    class="w-32 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as NotificationType)"
  />
</template>
