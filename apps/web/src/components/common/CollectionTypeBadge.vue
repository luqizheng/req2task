<script setup lang="ts">
import { CollectionType } from '@req2task/dto'
import { COLLECTION_TYPE_CONFIG } from '@/utils/enum-config'
import EnumBadge from './EnumBadge.vue'

defineProps<{
  value: CollectionType
}>()
</script>

<template>
  <EnumBadge :value="value" :config="COLLECTION_TYPE_CONFIG" class="text-xs" />
</template>
