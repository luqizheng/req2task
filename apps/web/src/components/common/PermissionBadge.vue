<script setup lang="ts">
import { Permission } from '@req2task/dto'
import { PERMISSION_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: Permission
}>()
</script>

<template>
  <EnumBadge :value="value" :config="PERMISSION_CONFIG" class="text-xs" />
</template>
