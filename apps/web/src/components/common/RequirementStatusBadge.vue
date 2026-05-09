<script setup lang="ts">
import { RequirementStatus } from '@req2task/dto'
import { REQUIREMENT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: RequirementStatus
}>()
</script>

<template>
  <EnumBadge :value="value" :config="REQUIREMENT_STATUS_CONFIG" class="text-xs" />
</template>
