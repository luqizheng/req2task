<script setup lang="ts">
import { computed } from 'vue';
import { ChatDotRound } from '@element-plus/icons-vue';
import { useRequirementCollectStore, MAX_QUESTION_COUNT } from '@/stores/requirementCollect';
import type { ChatMessage } from '@/api/requirementCollection';

const store = useRequirementCollectStore();

const requirement = computed(() => store.currentRawRequirement);

const sessionHistory = computed(() => requirement.value?.sessionHistory || []);

const chatRoundCount = computed(() => {
  const userMessages = sessionHistory.value.filter(m => m.role === 'user');
  return userMessages.length;
});

const questionProgress = computed(() => {
  if (!requirement.value) return null;
  return {
    current: requirement.value.questionCount || 0,
    max: MAX_QUESTION_COUNT,
    percentage: Math.min(((requirement.value.questionCount || 0) / MAX_QUESTION_COUNT) * 100, 100),
  };
});

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const handleQuestionClick = (message: ChatMessage) => {
  if (message.role === 'user' && requirement.value) {
    store.selectRawRequirement(requirement.value.id);
  }
};

const getMessageClass = (message: ChatMessage) => {
  return message.role === 'user' ? 'message-user' : 'message-assistant';
};

const getMessageIcon = (message: ChatMessage) => {
  return message.role === 'user' ? '👤' : '🤖';
};
</script>

<template>
  <div class="raw-requirement-main-panel">
    <div v-if="!requirement" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>未选中需求</h3>
      <p>请在右侧列表中选择一个需求查看详情</p>
    </div>

    <template v-else>
      <div class="panel-header">
        <h3>需求详情</h3>
        <el-tag v-if="questionProgress" type="info" size="small">
          追问 {{ questionProgress.current }}/{{ questionProgress.max }}
        </el-tag>
      </div>

      <div class="requirement-detail">
        <div class="detail-section">
          <div class="section-title">📝 原始内容</div>
          <div class="detail-content">
            {{ requirement.content }}
          </div>
        </div>

        <div v-if="requirement.source" class="detail-section">
          <div class="section-title">📌 来源</div>
          <div class="detail-text">{{ requirement.source }}</div>
        </div>

        <div v-if="requirement.clarifiedContent" class="detail-section">
          <div class="section-title">✨ 澄清内容</div>
          <div class="detail-content clarified">
            {{ requirement.clarifiedContent }}
          </div>
        </div>
      </div>

      <div class="history-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            追问历史
          </div>
          <span class="round-count">{{ chatRoundCount }} 轮对话</span>
        </div>

        <div v-if="sessionHistory.length === 0" class="empty-history">
          暂无追问记录
        </div>

        <div v-else class="history-list">
          <div
            v-for="(message, index) in sessionHistory"
            :key="index"
            :class="['history-item', getMessageClass(message)]"
          >
            <div class="item-avatar">{{ getMessageIcon(message) }}</div>
            <div class="item-content">
              <div class="message-header">
                <span class="message-role">{{ message.role === 'user' ? '追问' : 'AI 回答' }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div
                :class="['message-text', { clickable: message.role === 'user' }]"
                @click="handleQuestionClick(message)"
              >
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="requirement.followUpQuestions && requirement.followUpQuestions.length > 0" class="follow-up-section">
          <div class="section-title">💭 建议追问</div>
          <div class="follow-up-list">
            <el-button
              v-for="(question, index) in requirement.followUpQuestions"
              :key="index"
              size="small"
              class="follow-up-btn"
              @click="handleQuestionClick({ role: 'user', content: question, timestamp: new Date().toISOString() })"
            >
              {{ question }}
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.raw-requirement-main-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e4e7ed;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #606266;
}

.empty-state p {
  margin: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.requirement-detail {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.detail-content {
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-content.clarified {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.detail-text {
  font-size: 13px;
  color: #606266;
}

.history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.section-header .section-title {
  margin-bottom: 0;
}

.round-count {
  font-size: 12px;
  color: #909399;
}

.empty-history {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.history-item {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.history-item:last-child {
  margin-bottom: 0;
}

.item-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-assistant .item-avatar {
  background: #ecf5ff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-role {
  font-size: 11px;
  font-weight: 500;
  color: #909399;
}

.message-time {
  font-size: 11px;
  color: #c0c4cc;
}

.message-text {
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  padding: 10px 12px;
  border-radius: 8px;
  word-break: break-word;
}

.message-user .message-text {
  background: #ecf5ff;
  border-bottom-left-radius: 2px;
}

.message-assistant .message-text {
  background: #f4f4f5;
  border-bottom-right-radius: 2px;
}

.message-text.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.message-text.clickable:hover {
  background: #d9ecff;
}

.follow-up-section {
  padding: 12px 16px;
  background: #fffbf0;
  border-top: 1px solid #ffd591;
}

.follow-up-section .section-title {
  color: #d48806;
}

.follow-up-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.follow-up-btn {
  text-align: left;
  justify-content: flex-start;
}
</style>
