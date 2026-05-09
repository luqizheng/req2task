<script setup lang="ts">
import { UserRole } from '@req2task/dto'
import { USER_ROLE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: UserRole
}>()
</script>

<template>
  <EnumBadge :value="value" :config="USER_ROLE_CONFIG" class="text-xs" />
</template>
