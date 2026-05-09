<script setup lang="ts">
import { LLMProviderType } from '@req2task/dto'
import { LLM_PROVIDER_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: LLMProviderType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="LLM_PROVIDER_TYPE_CONFIG" class="text-xs" />
</template>
