<script setup lang="ts">
import { ref, computed } from 'vue';
import { AIChat } from '@req2task/ai-chat';
import '@req2task/ai-chat/dist/style.css'
import { useRequirementCollectStore, MAX_QUESTION_COUNT } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';

const store = useRequirementCollectStore();
const aiStore = useAiStore();

const chatRef = ref<InstanceType<typeof AIChat> | null>(null);

const activeConfigId = computed(() => aiStore.getActiveConfigId());

const isIndependentSession = computed(() => !!store.currentRawRequirementId);

const questionProgress = computed(() => {
  if (!isIndependentSession.value) return null;
  return {
    current: store.currentQuestionCount,
    max: MAX_QUESTION_COUNT,
    percentage: Math.min((store.currentQuestionCount / MAX_QUESTION_COUNT) * 100, 100),
  };
});

const chatConfig = computed(() => ({
  baseURL: '/api/ai',
  headers: activeConfigId.value ? { 'X-AI-Config-Id': activeConfigId.value } : undefined,
}));
</script>

<template>
  <div class="requirement-chat-panel">
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">💬</span>
        <span>AI 对话</span>
      </div>
      <div v-if="questionProgress" class="header-progress">
        <span class="progress-label">追问进度</span>
        <el-progress
          :percentage="questionProgress.percentage"
          :show-text="false"
          :stroke-width="3"
          :color="questionProgress.current >= MAX_QUESTION_COUNT ? '#67c23a' : '#409eff'"
        />
        <span class="progress-count">{{ questionProgress.current }}/{{ questionProgress.max }}</span>
      </div>
    </div>

    <AIChat
      ref="chatRef"
      :config="chatConfig"
      adapter-name="requirement-collect"
      title="AI 需求分析"
      placeholder="输入需求内容..."
      :max-height="'100%'"
      :show-window-header="false"
    />
  </div>
</template>

<style scoped>
.requirement-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  padding: 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 20px;
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.progress-count {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.header-progress :deep(.el-progress) {
  flex: 1;
}
</style>
