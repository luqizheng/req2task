<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Card as ShadcnCard } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardAction } from "@/components/ui/card";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    size?: "default" | "sm";
    title?: string;
    description?: string;
  }>(),
  {
    size: "default",
  },
);
</script>

<template>
  <ShadcnCard :class="props.class" :size="props.size">
    <!-- Header Section -->
    <CardHeader >
      <slot name="header">
        <div v-if="title" class="flex items-center gap-2">
          <slot name="title-icon" />
          <CardTitle>
            <slot name="title"> {{ title }}</slot>
          </CardTitle>
        </div>
        <CardDescription v-if="description">{{ description }}</CardDescription>
        <CardAction v-if="$slots.actions">
          <slot name="actions" />
        </CardAction>
      </slot>
    </CardHeader>
    <!-- Content Section -->
    <CardContent>
      <slot name="content">
        <slot />
      </slot>
    </CardContent>
    <CardFooter v-if="$slots.footer">
      <!-- Footer Section -->
      <slot name="footer">
        <slot name="footer" />
      </slot>
    </CardFooter>
  </ShadcnCard>
</template>
