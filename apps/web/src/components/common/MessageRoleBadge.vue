<script setup lang="ts">
import { MessageRole } from '@req2task/dto'
import { MESSAGE_ROLE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: MessageRole
}>()
</script>

<template>
  <EnumBadge :value="value" :config="MESSAGE_ROLE_CONFIG" class="text-xs" />
</template>
