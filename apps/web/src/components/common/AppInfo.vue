<template>
  <div class="app-info" :class="typeClass">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  type: "success" | "info" | "warning" | "danger";
}>();

const typeClass = computed(() => ({
  success: props.type === 'success',
  warning: props.type === 'warning',
  info: props.type === 'info',
  danger: props.type === 'danger',
}))
</script>

<style scoped>
.app-info {
  padding: 12px 16px;
  margin-bottom: 10px;
}
.success {
  background-color: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.warning {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}
.info {
  background-color: #dbeafe;
  color: #2563eb;
  border: 1px solid #60a5fa;
}
</style>
