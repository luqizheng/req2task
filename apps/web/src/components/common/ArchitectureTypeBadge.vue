<script setup lang="ts">
import { ArchitectureType } from '@req2task/dto'
import { ARCHITECTURE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ArchitectureType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="ARCHITECTURE_TYPE_CONFIG" class="text-xs" />
</template>
