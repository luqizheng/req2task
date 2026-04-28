<script setup lang="ts">
import { computed, ref } from "vue";
import { Promotion } from "@element-plus/icons-vue";
import { useRawRequirementCreateStore } from "./store";
import { useQuestionOperations } from "./useQuestionOperations";
import { useRequirementSubmit } from "./useRequirementSubmit";

import QuestionPanel from "./QuestionPanel.vue";
import RawRequirementAISubmit from "./components/RawRequirementAISubmit.vue";
import { RequirementCard } from "@/components/entity-card";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();

const aiSubmitRef = ref<InstanceType<typeof RawRequirementAISubmit> | null>(
  null,
);

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

const { handleSuccess, handleError, translRequestData, handleSSEData, save } =
  useRequirementSubmit(props.store);

const handleSubmitAnswers = () => {
  // emit("submit");
  aiSubmitRef.value?.submitStream();
};

const handleGenerateRequirement = async () => {
  await save();
};

const generalRequirementHandler = async () => {};
</script>

<template>
  <div class="input-and-questions">
    <QuestionPanel
      :store="store"
      v-model:question-filter="questionFilter"
      :editing-id="editingId"
      v-model:editing-answer="editingAnswer"
      v-model:show-add-dialog="showAddDialog"
      @edit-answer="handleEditAnswer"
      @save-answer="handleSaveAnswer"
      @cancel-edit="handleCancelEdit"
      @delete-question="handleDeleteQuestion"
    />

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
}
</style>
