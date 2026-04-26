<script setup lang="ts">
import { computed } from 'vue';
import type { RawRequirementQADto } from '@req2task/dto';

const props = defineProps<{
  qa: RawRequirementQADto;
  index?: number;
}>();

const isAnswered = computed(() => props.qa.answer !== null);
</script>

<template>
  <div class="raw-requirement-qa">
    <div class="qa-header">
      <div class="question-section">
        <div class="question-number">Q{{ index || 1 }}</div>
        <div class="question-content">{{ qa.question }}</div>
      </div>
      <div class="status-tag" :class="{ answered: isAnswered }">
        {{ isAnswered ? '已回答' : '未回答' }}
      </div>
    </div>
    <div v-if="qa.answer" class="qa-answer">
      {{ qa.answer }}
    </div>
    <div v-else  class="qa-answer">
      无回答
    </div>
    <div v-if="qa.answeredAt" class="qa-time">
      回答时间：{{ qa.answeredAt }}
    </div>
  </div>
</template>

<style scoped>
.raw-requirement-qa {
  border: 1px solid #e8e8e8;
  background-color: #fafafa;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.question-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.question-number {
  background-color: #0d0d0d;
  color: white;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: pre;
}

.question-content {
  font-size: 14px;
  font-weight: 500;
  color: #0d0d0d;
  flex: 1;
}

.status-tag {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: pre;
  border: 1px solid transparent;
}

.status-tag.answered {
  background-color: #f0fdf4;
  color: #22c55e;
  border-color: #22c55e;
}

.qa-answer {
  border-left: 3px solid #e8e8e8;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #0d0d0d;
  background-color: white;
}

.qa-time {
  font-size: 12px;
  color: #b0b0b0;
}
</style>