<script setup lang="ts">
import { ConversationStatus } from '@req2task/dto'
import { CONVERSATION_STATUS_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ConversationStatus
}>()
</script>

<template>
  <EnumBadge :value="value" :config="CONVERSATION_STATUS_CONFIG" class="text-xs" />
</template>
