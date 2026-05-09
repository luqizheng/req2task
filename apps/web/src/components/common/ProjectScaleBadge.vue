<script setup lang="ts">
import { ProjectScale } from '@req2task/dto'
import { PROJECT_SCALE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ProjectScale
}>()
</script>

<template>
  <EnumBadge :value="value" :config="PROJECT_SCALE_CONFIG" class="text-xs" />
</template>
