<script setup lang="ts">
import { useRouter } from 'vue-router';
import { MagicStick } from '@element-plus/icons-vue';

const router = useRouter();
</script>

<template>
  <div class="ai-assistant">
    <el-tooltip content="AI 智能助手" placement="left">
      <el-button
        type="primary"
        circle
        size="large"
        class="ai-btn"
        @click="router.push('/ai/chat')"
      >
        <el-icon :size="24"><MagicStick /></el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.ai-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}
</style>
