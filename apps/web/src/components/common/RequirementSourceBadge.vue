<script setup lang="ts">
import { RequirementSource } from '@req2task/dto'
import { REQUIREMENT_SOURCE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: RequirementSource
}>()
</script>

<template>
  <EnumBadge :value="value" :config="REQUIREMENT_SOURCE_CONFIG" class="text-xs" />
</template>
