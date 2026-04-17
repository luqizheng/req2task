<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AIChat } from '@req2task/ai-chat';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { useAiStore } from '@/stores/ai';
import { req2taskAdapter } from '@/adapters/req2task';
import { registerAdapter } from '@req2task/ai-chat';

registerAdapter(req2taskAdapter);

const userStore = useUserStore();
const aiStore = useAiStore();
const chatRef = ref<InstanceType<typeof AIChat> | null>(null);
const isLoading = ref(false);

const config = {
  endpoint: '/api/ai/chat',
  headers: {
    Authorization: `Bearer ${userStore.token}`,
  },
  userRoleName: '我',
  assistantRoleName: 'AI 助手',
};

const handleError = (error: Error) => {
  ElMessage.error(error.message || 'AI 对话出错');
};

onMounted(async () => {
  isLoading.value = true;
  try {
    await aiStore.fetchConfigs();
  } catch (error) {
    ElMessage.warning('加载AI配置失败，将使用默认配置');
  } finally {
    isLoading.value = false;
  }
});

defineExpose({
  clearChat: () => chatRef.value?.clearMessages(),
  getHistory: () => chatRef.value?.getMessages(),
  stopStream: () => chatRef.value?.stopStream(),
});
</script>

<template>
  <div class="ai-chat-view">
    <div class="chat-container" v-loading="isLoading">
      <AIChat
        ref="chatRef"
        :config="config"
        title="AI 助手"
        placeholder="输入消息，AI 将实时响应..."
        max-height="calc(100vh - 200px)"
        @error="handleError"
      />
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

.chat-container {
  height: 100%;
}
</style>
