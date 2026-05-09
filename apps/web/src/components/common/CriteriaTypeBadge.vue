<script setup lang="ts">
import { CriteriaType } from '@req2task/dto'
import { CRITERIA_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: CriteriaType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="CRITERIA_TYPE_CONFIG" class="text-xs" />
</template>
