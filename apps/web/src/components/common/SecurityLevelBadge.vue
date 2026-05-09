<script setup lang="ts">
import { SecurityLevel } from '@req2task/dto'
import { SECURITY_LEVEL_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: SecurityLevel
}>()
</script>

<template>
  <EnumBadge :value="value" :config="SECURITY_LEVEL_CONFIG" class="text-xs" />
</template>
