<script setup lang="ts">
defineProps<{
  shadow?: 'never' | 'hover' | 'always';
  bodyStyle?: string | Record<string, string>;
}>();
</script>

<template>
  <el-card :shadow="shadow || 'hover'" :body-style="bodyStyle" class="app-card">
    <template #header v-if="$slots.header">
      <slot name="header" />
    </template>
    <slot />
  </el-card>
</template>

<style scoped>
.app-card {
  border-radius: 8px;
}
</style>
