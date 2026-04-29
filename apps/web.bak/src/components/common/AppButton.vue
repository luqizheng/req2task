<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'default' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  plain?: boolean;
  round?: boolean;
  circle?: boolean;
}>();
</script>

<template>
  <el-button
    :type="type || 'default'"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :round="round"
    :circle="circle"
    class="app-button"
  >
    <slot />
  </el-button>
</template>

<style scoped>
.app-button {
  font-weight: 500;
}
</style>
