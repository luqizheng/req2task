<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});
</script>

<template>
  <div class="ai-chat-view" v-loading="isLoading">
    <div class="chat-placeholder">
      <el-empty description="AI 聊天功能正在开发中" />
    </div>
  </div>
</template>

<style scoped>
.ai-chat-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}

.chat-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}
</style>
