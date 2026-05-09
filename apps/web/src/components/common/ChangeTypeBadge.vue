<script setup lang="ts">
import { ChangeType } from '@req2task/dto'
import { CHANGE_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: ChangeType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="CHANGE_TYPE_CONFIG" class="text-xs" />
</template>
