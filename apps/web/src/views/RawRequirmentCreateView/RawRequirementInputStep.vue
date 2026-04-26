<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Plus, Promotion } from "@element-plus/icons-vue";
import { AiSubmit } from "@/components/ai-submit";
import { useRawRequirementCreateStore } from "./store";
import { useQuestionOperations } from "./useQuestionOperations";
import { useRequirementSubmit } from "./useRequirementSubmit";

import QuestionList from "./QuestionList.vue";
import { RequirementCard } from "@/components/entity-card";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();

const aiSubmitRef = ref<InstanceType<typeof AiSubmit> | null>(null);

const questionFilter = computed({
  get: () => props.store.questionFilter,
  set: (val: "all" | "pending" | "answered") =>
    props.store.setQuestionFilter(val),
});

const {
  newQuestion,
  newAnswer,
  editingId,
  editingAnswer,
  showAddDialog,
  handleAddQuestion,
  handleEditAnswer,
  handleSaveAnswer,
  handleCancelEdit,
  handleDeleteQuestion,
} = useQuestionOperations(props.store);

const { handleSuccess, handleError, translRequestData, handleSSEData, save } = useRequirementSubmit(props.store);

const handleSubmitAnswers = () => {
  // emit("submit");
  aiSubmitRef.value?.submitStream();
};

const handleGenerateRequirement = async () => {
  await save();
};

const generalRequirementHandler = async ()=>{

}
watch(
  () => props.store.messageHistory,
  () => {

    aiSubmitRef.value?.setMessageHistory(props.store.messageHistory || []);
  },
);
</script>

<template>
  <div class="input-and-questions">
    <div class="panel panel-left">
      <h2 class="panel-title">录入原始需求</h2>
      <p class="panel-desc">
        描述您的需求或问题，AI 将为您分析和处理。如果需要，AI
        会生成追问问题帮助澄清需求。
      </p>

      <AiSubmit
        ref="aiSubmitRef"
        :url="`/api/raw-requirements/${projectId}/stream`"
        :upload-file="true"
        :use-stream="true"
        message-key="conversationText"
        placeholder="描述您的需求或问题，AI 将为您分析和处理..."
        @success="handleSuccess"
        @error="handleError"
        :trans-request="translRequestData"
        @content="handleSSEData"
        mode="input-only"
      />

      <el-button
        v-if="store.hasAnsweredQuestions"
        type="primary"
        :icon="Promotion"
        @click="handleSubmitAnswers"
      >
        提交答案
      </el-button>
    </div>

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

        <el-radio-group v-model="questionFilter" size="default">
          <el-radio-button value="all">
            全部 ({{
              props.store.pendingQuestions.length +
              props.store.answeredQuestions.length
            }})
          </el-radio-button>
          <el-radio-button value="pending">
            未回答 ({{ props.store.pendingQuestions.length }})
          </el-radio-button>
          <el-radio-button value="answered">
            已回答 ({{ props.store.answeredQuestions.length }})
          </el-radio-button>
        </el-radio-group>

        <el-button
          type="primary"
          :icon="Plus"
          size="default"
          @click="showAddDialog = true"
        >
          添加新问题
        </el-button>

        <QuestionList
          :store="store"
          :editing-id="editingId"
          v-model:editing-answer="editingAnswer"
          @edit-answer="handleEditAnswer"
          @save-answer="handleSaveAnswer"
          @cancel-edit="handleCancelEdit"
          @delete-question="handleDeleteQuestion"
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

    <div class="panel panel-right-most">
      <h2 class="panel-title">生成的需求</h2>
      <el-button @click="generalRequirementHandler">生成修改</el-button>
      <div class="requirement-card-container">
        <RequirementCard
          v-if="store.rawRequirement.id"
          :data="{
            id: store.rawRequirement.id,
            title:
              store.rawRequirement.content.substring(0, 50) +
              (store.rawRequirement.content.length > 50 ? '...' : ''),
            priority: 'medium',
            status: store.rawRequirement.status,
            description: store.rawRequirement.content,
            createdAt: store.rawRequirement.createdAt,
          }"
        />
        <div v-else class="empty-requirement">
          <el-empty
            description="提交需求后将在此显示生成的需求卡片"
            :image-size="60"
          />
        </div>
      </div>
      <el-button
        v-if="store.rawRequirement.content && !store.rawRequirement.id"
        type="primary"
        :icon="Promotion"
        @click="handleGenerateRequirement"
      >
        生成需求
      </el-button>
    </div>
  </div>

  <el-dialog
    v-model="showAddDialog"
    title="添加新问题"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item label="问题内容">
        <el-input
          v-model="newQuestion"
          placeholder="输入问题内容"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="回答内容（可选）">
        <el-input
          v-model="newAnswer"
          placeholder="输入回答内容"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddDialog = false">取消</el-button>
      <el-button type="primary" @click="handleAddQuestion">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.input-and-questions {
  display: flex;
  gap: var(--spacing-card, 16px);
  min-height: 500px;
}

.panel {
  flex: 1;
  min-width: 0;
}

.panel-left {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component, 12px);
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component, 12px);
  padding-left: var(--spacing-card, 16px);
  border-left: 1px solid var(--color-border, #e2e8f0);
}

.panel-right-most {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component, 12px);
  padding-left: var(--spacing-card, 16px);
  border-left: 1px solid var(--color-border, #e2e8f0);
}

.requirement-card-container {
  flex: 1;
  overflow-y: auto;
}

.empty-requirement {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 8px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  margin: 0 0 4px 0;
}

.panel-desc {
  font-size: 14px;
  color: var(--color-text-secondary, #64748b);
  margin: 0;
  line-height: 1.6;
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
  .input-and-questions {
    flex-direction: column;
    min-height: auto;
  }

  .panel-right-most,
  .panel-left {
    flex: none;
    width: 100%;
  }

  .panel-right-most {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border, #e2e8f0);
    padding-top: var(--spacing-component, 12px);
  }

  .panel-right {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border, #e2e8f0);
    padding-top: var(--spacing-component, 12px);
  }
}
</style>
