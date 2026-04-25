<script setup lang="ts">
defineProps<{
  gap?: 'small' | 'medium' | 'large';
}>();

const gapMap = {
  small: '8px',
  medium: '12px',
  large: '16px',
};
</script>

<template>
  <div class="view-toolbar" :style="{ gap: gapMap[gap || 'medium'] }">
    <slot />
  </div>
</template>

<style scoped>
.view-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toolbar > :deep(*) {
  flex-shrink: 0;
}
</style>
