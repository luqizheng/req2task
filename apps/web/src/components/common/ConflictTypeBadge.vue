<script setup lang="ts">
import { ConflictType } from '@req2task/dto'
import { CONFLICT_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ConflictType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="CONFLICT_TYPE_CONFIG" class="text-xs" />
</template>
