<script setup lang="ts">
import { Priority } from '@req2task/dto'
import { PRIORITY_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: Priority
}>()
</script>

<template>
  <EnumBadge :value="value" :config="PRIORITY_CONFIG" class="text-xs" />
</template>
