<script setup lang="ts" generic="T extends string">
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EnumConfigMap } from '@/utils/enum-config'

defineProps<{
  value: T
  config: EnumConfigMap<T>
  showDot?: boolean
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  class?: string
}>()
</script>

<template>
  <Badge
    :variant="variant ?? config[value]?.variant ?? 'outline'"
    :class="cn(config[value]?.cssClass, showDot && 'px-2.5 py-0.5 font-medium text-xs', $props.class)"
  >
    <span
      v-if="showDot && config[value]?.dotClass"
      :class="['w-1.5 h-1.5 rounded-full mr-1.5', config[value]?.dotClass]"
    />
    {{ config[value]?.label ?? value }}
  </Badge>
</template>
