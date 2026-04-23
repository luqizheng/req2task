<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'default' | 'large';
  closable?: boolean;
  effect?: 'light' | 'dark' | 'plain';
  disableTransitions?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <el-tag
    :type="type"
    :size="size"
    :closable="closable"
    :effect="effect"
    :disable-transitions="disableTransitions"
    class="app-tag"
    @close="emit('close')"
  >
    <slot />
  </el-tag>
</template>

<style scoped>
.app-tag {
  border-radius: 4px;
}
</style>
