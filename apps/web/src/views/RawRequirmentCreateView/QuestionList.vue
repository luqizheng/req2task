<script setup lang="ts">
import { Delete, Check, Close } from "@element-plus/icons-vue";
import { useRawRequirementCreateStore } from "./store";

interface Props {
  store: ReturnType<typeof useRawRequirementCreateStore>;
  editingId: string | null;
  editingAnswer: string;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:editingAnswer": [value: string];
  editAnswer: [id: string, answer: string];
  saveAnswer: [id: string];
  cancelEdit: [];
  deleteQuestion: [id: string];
}>();

const updateEditingAnswer = (value: string) => {
  emit("update:editingAnswer", value);
};
</script>

<template>
  <div class="questions-list" role="list" aria-label="问题列表">
    <div
      v-for="qa in store.visibleQuestions"
      :key="qa.id"
      class="question-item"
      :class="{ answered: !!qa.answer }"
      role="listitem"
    >
      <div class="question-content">
        <div class="question-text">
          <span class="q-label" aria-hidden="true">Q:</span>
          {{ qa.question }}
        </div>
        <div v-if="qa.purpose" class="purpose-text">
          <span class="p-label">目的:</span>
          {{ qa.purpose }}
        </div>

        <div v-if="qa.answer" class="answer-text">
          <span class="a-label" aria-hidden="true">A:</span>
          {{ qa.answer }}
        </div>
      </div>

      <div class="question-actions">
        <template v-if="editingId === qa.id">
          <el-input
            :model-value="editingAnswer"
            type="textarea"
            :rows="2"
            placeholder="输入回答..."
            size="small"
            aria-label="编辑回答"
            @update:model-value="updateEditingAnswer"
          />
          <el-button
            type="success"
            :icon="Check"
            size="small"
            aria-label="保存回答"
            @click="emit('saveAnswer', qa.id)"
          >
            保存
          </el-button>
          <el-button
            type="info"
            :icon="Close"
            size="small"
            aria-label="取消编辑"
            @click="emit('cancelEdit')"
          >
            取消
          </el-button>
        </template>
        <template v-else>
          <el-button
            v-if="!qa.answer"
            type="primary"
            size="small"
            @click="emit('editAnswer', qa.id, qa.answer ?? '')"
          >
            回答
          </el-button>
          <el-button
            v-else
            type="warning"
            size="small"
            @click="emit('editAnswer', qa.id, qa.answer ?? '')"
          >
            编辑回答
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            :aria-label="qa.answer ? '删除问题' : '跳过问题'"
            @click="emit('deleteQuestion', qa.id)"
          >
            {{ qa.answer ? "删除" : "跳过" }}
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.questions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component, 12px);
  overflow-y: auto;
  max-height: 400px;
  padding-right: 4px;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-compact, 8px);
  padding: var(--spacing-component, 12px);
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.question-item:hover {
  border-color: var(--color-info, #6366f1);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.question-item.answered {
  background: #f0fdf4;
  border-color: var(--color-success, #10b981);
}

.question-content {
  flex: 1;
}

.question-text,
.answer-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
}

.question-text {
  color: var(--color-text-primary, #1e293b);
}

.purpose-text {
  font-size: 13px;
  color: var(--color-info, #6366f1);
  padding-left: 16px;
  margin-bottom: 4px;
}

.p-label {
  font-weight: 600;
  margin-right: 4px;
}

.answer-text {
  color: var(--color-text-secondary, #64748b);
  padding-left: 16px;
}

.q-label,
.a-label {
  font-weight: 600;
  margin-right: 4px;
}

.q-label {
  color: var(--color-warning, #f59e0b);
}

.a-label {
  color: var(--color-success, #10b981);
}

.question-actions {
  display: flex;
  gap: var(--spacing-compact, 8px);
  align-items: flex-start;
  flex-wrap: wrap;
}

.question-actions :deep(.el-textarea) {
  flex: 1;
  min-width: 200px;
}

@media (max-width: 768px) {
  .questions-list {
    max-height: 300px;
  }

  .question-actions :deep(.el-textarea) {
    min-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .question-item {
    transition: none;
  }
}
</style>
