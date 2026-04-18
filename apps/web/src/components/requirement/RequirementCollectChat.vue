<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { Promotion, Loading } from '@element-plus/icons-vue';
import { useRequirementCollectStore, ChatMessageUI, MAX_QUESTION_COUNT } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';

const props = defineProps<{
  disabled?: boolean;
}>();

const store = useRequirementCollectStore();
const aiStore = useAiStore();

const inputMessage = ref('');
const chatContainerRef = ref<HTMLElement | null>(null);

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

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

watch(() => store.chatHistory.length, () => {
  scrollToBottom();
}, { immediate: true });

const handleSend = async () => {
  if (!inputMessage.value.trim() || store.isSending || props.disabled) return;

  const message = inputMessage.value.trim();
  inputMessage.value = '';

  try {
    await store.sendMessage(
      message,
      '对话收集',
      activeConfigId.value
    );
  } catch (error) {
    // Error is handled by store
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

const handleFollowUpClick = async (question: string) => {
  if (props.disabled) return;
  inputMessage.value = question;
  await handleSend();
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const getMessageClass = (message: ChatMessageUI) => {
  if (message.isLoading) return 'message-loading';
  return message.role === 'user' ? 'message-user' : 'message-assistant';
};
</script>

<template>
  <div class="requirement-collect-chat">
    <div v-if="!store.currentCollection" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>请先选择或创建需求收集</h3>
      <p>在顶部下拉框中选择已有的收集，或点击"新建收集"开始</p>
    </div>

    <template v-else>
      <div class="chat-header">
        <div v-if="store.currentRawRequirement" class="session-info">
          <span class="session-label">当前需求分析</span>
          <span class="session-content">{{ store.currentRawRequirement.content.substring(0, 50) }}...</span>
          <div v-if="questionProgress" class="question-progress">
            <span class="progress-text">追问轮次：{{ questionProgress.current }}/{{ questionProgress.max }}</span>
            <el-progress
              :percentage="questionProgress.percentage"
              :show-text="false"
              :stroke-width="4"
              :color="questionProgress.current >= MAX_QUESTION_COUNT ? '#67c23a' : '#409eff'"
            />
          </div>
          <el-tag v-if="store.isMaxQuestionReached" type="warning" size="small">
            已达追问上限
          </el-tag>
        </div>
        <div v-else class="welcome-hint">
          请输入需求开始分析
        </div>
      </div>

      <div class="chat-messages" ref="chatContainerRef">
        <div v-if="store.chatHistory.length === 0" class="welcome-message">
          <div class="welcome-icon">🤖</div>
          <h3>AI 需求分析师</h3>
          <p>您好！我是您的 AI 需求分析师助手。请告诉我您的需求，我将帮助您收集、整理和分析需求信息。</p>
          <div class="suggestion-list">
            <p>您可以这样描述您的需求：</p>
            <ul>
              <li>"客户需要存储物品的功能"</li>
              <li>"系统需要支持用户登录和权限管理"</li>
              <li>"订单处理流程需要优化"</li>
            </ul>
          </div>
        </div>

        <div
          v-for="message in store.chatHistory"
          :key="message.id"
          :class="['message', getMessageClass(message)]"
        >
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div v-if="message.isLoading" class="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <template v-else>
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </template>
          </div>
        </div>

        <div
          v-if="store.currentRawRequirement?.followUpQuestions && store.currentRawRequirement.followUpQuestions.length > 0"
          class="follow-up-section"
        >
          <div class="section-title">💭 AI 追问</div>
          <div class="follow-up-buttons">
            <el-button
              v-for="(question, index) in (store.currentRawRequirement?.followUpQuestions || [])"
              :key="index"
              size="small"
              @click="handleFollowUpClick(question)"
              :disabled="store.isSending"
            >
              {{ question }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="2"
          :placeholder="isIndependentSession ? '回复 AI 的追问...' : '输入需求内容，AI 将帮助您分析和追问...'"
          :disabled="disabled || store.isSending || store.isMaxQuestionReached"
          @keydown="handleKeyDown"
          resize="none"
        />
        <el-button
          type="primary"
          :icon="store.isSending ? Loading : Promotion"
          :disabled="!inputMessage.trim() || disabled || store.isMaxQuestionReached"
          :loading="store.isSending"
          @click="handleSend"
          class="send-button"
        >
          发送
        </el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.requirement-collect-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
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

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  background: #f5f7fa;
  border-radius: 12px;
  margin-bottom: 20px;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.welcome-message h3 {
  margin: 0 0 12px;
  color: #303133;
}

.welcome-message p {
  margin: 0;
  color: #606266;
}

.suggestion-list {
  text-align: left;
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.suggestion-list p {
  margin: 0 0 8px;
  font-weight: 500;
}

.suggestion-list ul {
  margin: 0;
  padding-left: 20px;
  color: #409eff;
}

.suggestion-list li {
  margin-bottom: 4px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.message-assistant .message-avatar {
  background: #ecf5ff;
}

.message-content {
  max-width: 70%;
}

.message-user .message-content {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-user .message-text {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-text {
  background: #f4f4f5;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.message-loading .message-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f4f4f5;
  border-radius: 12px;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #909399;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.follow-up-section {
  margin-top: 20px;
  padding: 16px;
  background: #fff7e6;
  border-radius: 8px;
  border: 1px solid #ffd591;
}

.section-title {
  font-weight: 500;
  color: #d48806;
  margin-bottom: 12px;
}

.follow-up-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.follow-up-buttons .el-button {
  text-align: left;
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: white;
}

.chat-input .el-textarea {
  flex: 1;
}

.send-button {
  align-self: flex-end;
}

.chat-header {
  padding: 12px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-label {
  font-size: 12px;
  color: #909399;
}

.session-content {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.question-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 300px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.welcome-hint {
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
