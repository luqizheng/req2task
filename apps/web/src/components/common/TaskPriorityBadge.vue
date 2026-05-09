<script setup lang="ts">
import { TaskPriority } from '@req2task/dto'
import { TASK_PRIORITY_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: TaskPriority
}>()
</script>

<template>
  <EnumBadge :value="value" :config="TASK_PRIORITY_CONFIG" class="text-xs" />
</template>
