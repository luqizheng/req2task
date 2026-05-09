<script setup lang="ts">
import { NotificationType } from '@req2task/dto'
import { NOTIFICATION_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: NotificationType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="NOTIFICATION_TYPE_CONFIG" class="text-xs" />
</template>
