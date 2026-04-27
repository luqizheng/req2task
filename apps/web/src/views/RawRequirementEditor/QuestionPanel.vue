<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import QuestionList from "./QuestionList.vue";

interface Props {
  store: any;
  questionFilter: "all" | "pending" | "answered";
  editingId: string | null;
  editingAnswer: string;
  showAddDialog: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:questionFilter": [value: "all" | "pending" | "answered"];
  "update:showAddDialog": [value: boolean];
  "update:editingAnswer": [value: string];
  "edit-answer": [id: string, answer: string];
  "save-answer": [id: string];
  "cancel-edit": [];
  "delete-question": [id: string];
}>();
</script>

<template>
  <div class="panel panel-right">
    <template v-if="store.hasQuestions">
      <div class="panel-header">
        <h2 class="panel-title">问题澄清</h2>
        <div class="question-stats">
          <el-tag type="warning" size="small">
            {{ store.pendingQuestions.length }} 待回答
          </el-tag>
          <el-tag type="success" size="small">
            {{ store.answeredQuestions.length }} 已回答
          </el-tag>
        </div>
      </div>

      <el-radio-group
        :model-value="questionFilter"
        @update:model-value="emit('update:questionFilter', $event)"
        size="default"
      >
        <el-radio-button value="all">
          全部 ({{
            store.pendingQuestions.length + store.answeredQuestions.length
          }})
        </el-radio-button>
        <el-radio-button value="pending">
          未回答 ({{ store.pendingQuestions.length }})
        </el-radio-button>
        <el-radio-button value="answered">
          已回答 ({{ store.answeredQuestions.length }})
        </el-radio-button>
      </el-radio-group>

      <el-button
        type="primary"
        :icon="Plus"
        size="default"
        @click="emit('update:showAddDialog', true)"
      >
        添加新问题
      </el-button>

      <QuestionList
        :store="store"
        :editing-id="editingId"
        :editing-answer="editingAnswer"
        @update:editing-answer="emit('update:editingAnswer', $event)"
        @edit-answer="emit('edit-answer', $event[0], $event[1])"
        @save-answer="emit('save-answer', $event)"
        @cancel-edit="emit('cancel-edit')"
        @delete-question="emit('delete-question', $event)"
      />

      <div v-if="store.deletedQuestions.length > 0" class="skipped-section">
        <div class="section-title">已跳过的问题</div>
        <div
          v-for="qa in store.deletedQuestions"
          :key="qa.id"
          class="skipped-item"
        >
          <span class="q-label" aria-hidden="true">Q:</span>
          {{ qa.question }}
          <el-button
            type="primary"
            link
            size="small"
            @click="store.restoreQuestion(qa.id)"
          >
            恢复
          </el-button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="empty-questions">
        <el-empty
          description="AI 将在分析需求后生成追问问题"
          :image-size="80"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.panel {
  flex: 1;
  min-width: 0;
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component, 12px);
  padding-left: var(--spacing-card, 16px);
  border-left: 1px solid var(--color-border, #e2e8f0);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  margin: 0 0 4px 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-stats {
  display: flex;
  gap: var(--spacing-compact, 8px);
}

.skipped-section {
  margin-top: var(--spacing-component, 12px);
  padding-top: var(--spacing-component, 12px);
  border-top: 1px dashed var(--color-border, #e2e8f0);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-placeholder, #94a3b8);
  margin-bottom: var(--spacing-compact, 8px);
}

.skipped-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-compact, 8px);
  padding: 6px 10px;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 6px;
  margin-bottom: 6px;
  color: var(--color-text-placeholder, #94a3b8);
  text-decoration: line-through;
  font-size: 13px;
}

.q-label {
  font-weight: 600;
  margin-right: 4px;
  color: var(--color-warning, #f59e0b);
}

.empty-questions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

@media (max-width: 768px) {
  .panel-right {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border, #e2e8f0);
    padding-top: var(--spacing-component, 12px);
  }
}
</style>
