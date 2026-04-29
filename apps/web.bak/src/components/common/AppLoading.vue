<script setup lang="ts">
defineProps<{
  fullscreen?: boolean;
  text?: string;
  spinner?: string;
  background?: string;
  lock?: boolean;
}>();
</script>

<template>
  <el-config-provider>
    <el-loading
      :fullscreen="fullscreen"
      :text="text"
      :spinner="spinner"
      :background="background"
      :lock="lock"
      class="app-loading"
    >
      <slot />
    </el-loading>
  </el-config-provider>
</template>

<style scoped>
.app-loading {
  display: inline-block;
}
</style>
