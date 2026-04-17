<script setup lang="ts">
defineProps<{
  value?: string | number;
  max?: number;
  isDot?: boolean;
  hidden?: boolean;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}>();
</script>

<template>
  <el-badge
    :value="value"
    :max="max"
    :is-dot="isDot"
    :hidden="hidden"
    :type="type"
    class="app-badge"
  >
    <slot />
  </el-badge>
</template>

<style scoped>
.app-badge {
  display: inline-block;
}
</style>
