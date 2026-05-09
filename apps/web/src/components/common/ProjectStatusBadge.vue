<script setup lang="ts">
import { ProjectStatus } from '@req2task/dto'
import { PROJECT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ProjectStatus
}>()
</script>

<template>
  <EnumBadge :value="value" :config="PROJECT_STATUS_CONFIG" class="text-xs" />
</template>
