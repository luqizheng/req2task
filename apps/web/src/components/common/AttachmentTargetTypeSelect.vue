<script setup lang="ts">
import { AttachmentTargetType } from '@req2task/dto'
import { ATTACHMENT_TARGET_TYPE_CONFIG } from '@/utils/enum-config'
import EnumSelect from './EnumSelect.vue'

defineProps<{
  modelValue?: AttachmentTargetType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AttachmentTargetType]
}>()
</script>

<template>
  <EnumSelect
    :model-value="modelValue"
    :config="ATTACHMENT_TARGET_TYPE_CONFIG"
    placeholder="附件类型"
    class="w-28 h-7 text-xs"
    @update:model-value="(v) => v && emit('update:modelValue', v as AttachmentTargetType)"
  />
</template>
