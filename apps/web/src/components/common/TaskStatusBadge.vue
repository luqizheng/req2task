<script setup lang="ts">
import { TaskStatus } from '@req2task/dto'
import { TASK_STATUS_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: TaskStatus
}>()
</script>

<template>
  <EnumBadge :value="value" :config="TASK_STATUS_CONFIG" class="text-xs" />
</template>
