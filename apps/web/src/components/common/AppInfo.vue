<template>
  <div class="app-info" :class="typeClass">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
type Props = {
  type: "default" | "success" | "info" | "warning" | "danger";
};

const props = withDefaults(defineProps<Props>(), {
  type: "info",
});
const typeClass = computed(() => ({
  success: props.type === "success",
  warning: props.type === "warning",
  info: props.type === "info",
  danger: props.type === "danger",
}));
</script>

<style scoped>
.app-info {
  margin: 12px 0px;
  border-radius: 6px;
  padding: 8px 10px 8px 10px;
  color: #71717a;
  background-color: rgba(248, 248, 250, 1);
  border: 1px solid rgba(248, 248, 250, 1);
}

.default {
  color: #71717a;
  background-color: rgba(248, 248, 250, 1);
  border: 1px solid #a1a1aa;
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
