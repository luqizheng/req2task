<script setup lang="ts">
import { DatabaseType } from '@req2task/dto'
import { DATABASE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: DatabaseType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="DATABASE_TYPE_CONFIG" class="text-xs" />
</template>
