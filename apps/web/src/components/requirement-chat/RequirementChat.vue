<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Delete, ChatDotRound, Loading } from '@element-plus/icons-vue';
import { rawRequirementsApi, type ChatMessage } from '@/api/rawRequirements';
import type { RawRequirementResponseDto } from '@req2task/dto';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  isAnswered: boolean;
  isDeleted: boolean;
}

interface Props {
  rawRequirement: RawRequirementResponseDto;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'complete', questions: QAItem[]): void;
  (e: 'close'): void;
}>();

const qaItems = ref<QAItem[]>([]);
const currentQuestion = ref<string | null>(null);
const currentAnswer = ref('');
const isLoading = ref(false);
const isSending = ref(false);
const isComplete = ref(false);
const assistantMessage = ref('');

const pendingQuestions = computed(() =>
  qaItems.value.filter(q => !q.isAnswered && !q.isDeleted)
);

const answeredQuestions = computed(() =>
  qaItems.value.filter(q => q.isAnswered && !q.isDeleted)
);

const canSendAnswer = computed(() =>
  currentAnswer.value.trim() && !isSending.value && !isLoading.value
);

const canGenerateRequirements = computed(() =>
  answeredQuestions.value.length > 0 && !isLoading.value && !isSending.value
);

watch(() => props.rawRequirement.questionAndAnswers, (newQAs) => {
  if (newQAs && newQAs.length > 0) {
    qaItems.value = newQAs.map(qa => ({
      id: qa.id,
      question: qa.question,
      answer: qa.answer || '',
      isAnswered: !!qa.answer,
      isDeleted: false,
    }));
  }
}, { immediate: true });

const handleSendAnswer = async () => {
  if (!currentAnswer.value.trim() || !pendingQuestions.value[0]) return;

  const currentQ = pendingQuestions.value[0];
  currentQ.answer = currentAnswer.value.trim();
  currentQ.isAnswered = true;

  const nextQ = pendingQuestions.value[0];
  if (nextQ) {
    currentQuestion.value = nextQ.question;
  } else {
    currentQuestion.value = null;
  }
  currentAnswer.value = '';

  await sendChatMessage(currentQ.answer);
};

const sendChatMessage = async (message: string) => {
  isSending.value = true;
  assistantMessage.value = '';

  try {
    const result = await rawRequirementsApi.chatCollect(
      props.rawRequirement.id,
      message
    );

    if (result.followUpQuestions && result.followUpQuestions.length > 0) {
      const newQuestions = result.followUpQuestions.filter(
        (q: string) => !qaItems.value.some(item => item.question === q)
      );

      newQuestions.forEach((q: string) => {
        qaItems.value.push({
          id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: q,
          answer: '',
          isAnswered: false,
          isDeleted: false,
        });
      });

      const nextQ = pendingQuestions.value[0];
      if (nextQ) {
        currentQuestion.value = nextQ.question;
      }
    }

    if (result.isComplete) {
      isComplete.value = true;
    }

    if (result.assistantMessage) {
      assistantMessage.value = result.assistantMessage;
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '发送失败');
  } finally {
    isSending.value = false;
  }
};

const handleSkipQuestion = () => {
  if (pendingQuestions.value.length > 0) {
    const currentQ = pendingQuestions.value[0];
    currentQ.isDeleted = true;

    const nextQ = pendingQuestions.value[0];
    if (nextQ) {
      currentQuestion.value = nextQ.question;
    } else {
      currentQuestion.value = null;
    }
  }
};

const handleDeleteQuestion = (id: string) => {
  const item = qaItems.value.find(q => q.id === id);
  if (item) {
    item.isDeleted = true;
  }
};

const handleGenerateRequirements = () => {
  const validQAs = qaItems.value.filter(q => q.isAnswered && !q.isDeleted);
  emit('complete', validQAs);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendAnswer();
  }
};
</script>

<template>
  <div class="requirement-chat">
    <div class="chat-header">
      <div class="header-title">
        <el-icon><ChatDotRound /></el-icon>
        <span>智能追问</span>
      </div>
      <el-button text @click="emit('close')">关闭</el-button>
    </div>

    <div class="chat-content">
      <div v-if="assistantMessage" class="assistant-message">
        <div class="message-label">AI 分析：</div>
        <div class="message-text">{{ assistantMessage }}</div>
      </div>

      <div v-if="pendingQuestions.length > 0" class="current-question">
        <div class="question-label">
          <span class="label-text">当前问题</span>
          <span class="question-count">{{ pendingQuestions.length }} 个问题待回答</span>
        </div>
        <div class="question-box">
          <div class="question-text">{{ currentQuestion || pendingQuestions[0]?.question }}</div>
          <div class="question-actions">
            <el-button size="small" @click="handleSkipQuestion">跳过</el-button>
          </div>
        </div>
        <div class="answer-input">
          <el-input
            v-model="currentAnswer"
            type="textarea"
            :rows="3"
            placeholder="请输入您的回答..."
            resize="none"
            @keydown="handleKeyDown"
          />
          <el-button
            type="primary"
            :disabled="!canSendAnswer"
            :loading="isSending"
            @click="handleSendAnswer"
          >
            发送
          </el-button>
        </div>
      </div>

      <div v-else-if="!isComplete" class="no-questions">
        <el-icon class="loading-icon" v-if="isSending"><Loading /></el-icon>
        <span v-else>暂无追问问题，请点击下方按钮生成需求</span>
      </div>

      <div v-if="answeredQuestions.length > 0" class="answered-list">
        <div class="section-title">已回答的问题</div>
        <div
          v-for="qa in answeredQuestions"
          :key="qa.id"
          class="qa-item"
        >
          <div class="qa-content">
            <div class="qa-question">
              <span class="q-label">Q:</span>
              {{ qa.question }}
            </div>
            <div class="qa-answer">
              <span class="a-label">A:</span>
              {{ qa.answer }}
            </div>
          </div>
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            circle
            @click="handleDeleteQuestion(qa.id)"
          />
        </div>
      </div>

      <div v-if="pendingQuestions.length === 0" class="skipped-list">
        <div class="section-title">已跳过的问题</div>
        <div
          v-for="qa in qaItems.filter(q => q.isDeleted)"
          :key="qa.id"
          class="skipped-item"
        >
          <span class="q-label">Q:</span>
          {{ qa.question }}
        </div>
        <div v-if="qaItems.filter(q => q.isDeleted).length === 0" class="no-skipped">
          无
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <el-button
        type="primary"
        size="large"
        :disabled="!canGenerateRequirements"
        @click="handleGenerateRequirements"
      >
        生成需求
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.requirement-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.assistant-message {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-label {
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
}

.current-question {
  margin-bottom: 20px;
}

.question-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.question-count {
  font-size: 12px;
  color: #64748b;
}

.question-box {
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  margin-bottom: 12px;
}

.question-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 8px;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
}

.answer-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.answer-input :deep(.el-textarea) {
  flex: 1;
}

.no-questions {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 14px;
}

.loading-icon {
  font-size: 20px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.answered-list,
.skipped-list {
  margin-top: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e2e8f0;
}

.qa-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.qa-content {
  flex: 1;
}

.qa-question,
.qa-answer {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.qa-question {
  color: #1e293b;
}

.qa-answer {
  color: #64748b;
}

.q-label,
.a-label {
  font-weight: 600;
  margin-right: 4px;
}

.q-label {
  color: #f59e0b;
}

.a-label {
  color: #10b981;
}

.skipped-item {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 6px;
  text-decoration: line-through;
}

.no-skipped {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  padding: 12px;
}

.chat-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}
</style>
