<script setup lang="ts">
import { AttachmentTargetType } from '@req2task/dto'
import { ATTACHMENT_TARGET_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: AttachmentTargetType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="ATTACHMENT_TARGET_TYPE_CONFIG" class="text-xs" />
</template>
