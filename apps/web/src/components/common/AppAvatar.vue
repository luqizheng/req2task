<script setup lang="ts">
defineProps<{
  src?: string;
  size?: number | 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square';
  alt?: string;
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}>();
</script>

<template>
  <el-avatar
    :src="src"
    :size="size"
    :shape="shape"
    :alt="alt"
    :fit="fit"
    class="app-avatar"
  >
    <slot />
  </el-avatar>
</template>

<style scoped>
.app-avatar {
  background: #409eff;
  color: #fff;
}
</style>
