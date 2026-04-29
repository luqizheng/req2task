<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Card as ShadcnCard } from '@/components/ui/card'
import { CardHeader } from '@/components/ui/card'
import { CardContent } from '@/components/ui/card'
import { CardFooter } from '@/components/ui/card'
import { CardTitle } from '@/components/ui/card'
import { CardDescription } from '@/components/ui/card'
import { CardAction } from '@/components/ui/card'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
  title?: string
  description?: string
}>(), {
  size: 'default',
})
</script>

<template>
  <ShadcnCard :class="props.class" :size="props.size">
    <!-- Header Section -->
    <slot name="header">
      <CardHeader v-if="title || description || $slots['title-icon']">
        <div v-if="title" class="flex items-center gap-2">
          <slot name="title-icon" />
          <CardTitle>{{ title }}</CardTitle>
        </div>
        <CardDescription v-if="description">{{ description }}</CardDescription>
        <CardAction v-if="$slots.actions">
          <slot name="actions" />
        </CardAction>
      </CardHeader>
    </slot>

    <!-- Content Section -->
    <slot name="content">
      <CardContent>
        <slot />
      </CardContent>
    </slot>

    <!-- Footer Section -->
    <slot name="footer">
      <CardFooter v-if="$slots.footer">
        <slot name="footer" />
      </CardFooter>
    </slot>
  </ShadcnCard>
</template>