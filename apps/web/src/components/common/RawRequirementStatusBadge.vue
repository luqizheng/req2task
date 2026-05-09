<script setup lang="ts">
import { RawRequirementStatus } from '@req2task/dto'
import { RAW_REQUIREMENT_STATUS_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: RawRequirementStatus
}>()
</script>

<template>
  <EnumBadge :value="value" :config="RAW_REQUIREMENT_STATUS_CONFIG" class="text-xs" />
</template>
