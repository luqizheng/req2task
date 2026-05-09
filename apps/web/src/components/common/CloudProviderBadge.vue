<script setup lang="ts">
import { CloudProvider } from '@req2task/dto'
import { CLOUD_PROVIDER_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: CloudProvider
}>()
</script>

<template>
  <EnumBadge :value="value" :config="CLOUD_PROVIDER_CONFIG" class="text-xs" />
</template>
