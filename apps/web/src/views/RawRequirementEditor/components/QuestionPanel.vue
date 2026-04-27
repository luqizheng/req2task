<template>
  <div class="question-panel">
    <div class="panel-header">
      <h2 class="panel-title">问题列表</h2>
    </div>
    <div class="questions-scroll-area">
      <div
        v-for="(qa, index) in questions"
        :key="qa.id"
        class="qa-card"
        :class="getCardClass(qa)"
        @click="handleCardClick(qa)"
      >
        <div class="qa-header">
          <div class="header-left">
            <div class="active-dot" :class="{ 'is-active': isSelected(qa) }">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
              </svg>
            </div>
            <span class="question-number">{{ index + 1 }}</span>
            <div class="divider-line"></div>
          </div>
          <div v-if="isSelected(qa)" class="status-tag answering">回答中</div>
          <div v-else-if="isAnswered(qa)" class="status-tag answered">已回答</div>
        </div>

        <div class="question-text">{{ qa.question }}</div>

        <div v-if="qa.purpose && isSelected(qa)" class="purpose-tag">
          <span class="purpose-label">目的：</span>
          <span class="purpose-content">{{ qa.purpose }}</span>
        </div>

        <div v-if="isSelected(qa)" class="answer-section">
          <el-input
            v-model="currentAnswer"
            type="textarea"
            :rows="3"
            placeholder="请输入您的回答..."
            class="answer-input"
            @click.stop
          />
          <div class="action-buttons">
            <el-button class="cancel-btn" @click.stop="handleCancel">取消</el-button>
            <el-button type="primary" class="submit-btn" @click.stop="handleSubmit">提交回答</el-button>
          </div>
        </div>

        <div v-else-if="!isAnswered(qa)" class="hint-section">
          <svg class="hint-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="hint-text">点击卡片开始回答问题</span>
        </div>

        <div v-else class="answer-display">
          <div class="answer-label">回答：</div>
          <div class="answer-content">{{ qa.answer }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RawRequirementQADto } from '@req2task/dto'
import { useRawRequirementCreateStore } from '../store';

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const questions = computed(() => props.store.rawRequirement.questionAndAnswers || [])
 
const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string]
  cancel: []
  submit: [id: string, answer: string]
}>()

const selectedId = ref<string | null>(null)
const currentAnswer = ref('')

const isAnswered = (qa: RawRequirementQADto) => {
  return qa.answer !== null && qa.answer !== '' && qa.answer !== undefined
}

const isSelected = (qa: RawRequirementQADto) => {
  return selectedId.value === qa.id
}

const getCardClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) {
    return 'is-selected'
  }
  if (isAnswered(qa)) {
    return 'is-answered'
  }
  return ''
}

const handleCardClick = (qa: RawRequirementQADto) => {
  if (!isAnswered(qa)) {
    selectedId.value = qa.id
    currentAnswer.value = ''
    emit('select', qa.id)
  }
}

const handleCancel = () => {
  selectedId.value = null
  currentAnswer.value = ''
  emit('cancel')
}

const handleSubmit = () => {
  if (selectedId.value && currentAnswer.value.trim()) {
    emit('submit', selectedId.value, currentAnswer.value.trim())
    selectedId.value = null
    currentAnswer.value = ''
  }
}
</script>

<style scoped>
.question-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  padding: 16px 0;
  border-bottom: 1px solid #e4e4e4;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.questions-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e4e4e4;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-card:hover {
  border-color: #cbd5e1;
}

.qa-card.is-selected {
  background: #eff6ff;
  border: 1.5px solid #2563eb;
  cursor: default;
}

.qa-card.is-answered {
  background: #f0fdf4;
  border-color: #10b981;
}

.qa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-dot {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.active-dot.is-active {
  background: #fdeadb;
  color: #2563eb;
}

.active-dot svg {
  width: 11px;
  height: 11px;
}

.question-number {
  font-size: 12px;
  font-weight: 600;
  color: #1b1818;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #e4e4e4;
  min-width: 20px;
}

.status-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.answering {
  background: #fdeadb;
  color: #2563eb;
}

.status-tag.answered {
  background: #dcfce7;
  color: #10b981;
}

.question-text {
  font-size: 13px;
  font-weight: 500;
  color: #1b1818;
  line-height: 1.5;
}

.purpose-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: #fdeadb;
  border-radius: 6px;
  align-self: flex-start;
}

.purpose-label {
  font-size: 12px;
  font-weight: 500;
  color: #faa560;
}

.purpose-content {
  font-size: 12px;
  color: #2563eb;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-input {
  border-radius: 8px;
}

.answer-input :deep(.el-textarea__inner) {
  border: 1.5px solid #2563eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #a1a1aa;
}

.answer-input :deep(.el-textarea__inner:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0 14px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e4e4e4;
  background: #fff;
  color: #716f71;
  font-size: 13px;
  font-weight: 500;
}

.cancel-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.submit-btn {
  padding: 0 14px;
  height: 32px;
  border-radius: 6px;
  background: #2563eb;
  border: none;
  font-size: 13px;
  font-weight: 600;
}

.submit-btn:hover {
  background: #1d4ed8;
}

.hint-section {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #fffbf0;
  border: 1px solid #fde68a;
  border-radius: 8px;
}

.hint-icon {
  width: 16px;
  height: 16px;
  color: #d97706;
}

.hint-text {
  font-size: 12px;
  color: #d97706;
}

.answer-display {
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.answer-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 4px;
}

.answer-content {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.5;
}
</style>
