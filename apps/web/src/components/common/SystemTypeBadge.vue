<script setup lang="ts">
import { SystemType } from '@req2task/dto'
import { SYSTEM_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: SystemType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="SYSTEM_TYPE_CONFIG" class="text-xs" />
</template>
