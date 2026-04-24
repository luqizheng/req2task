<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete, Edit, Check, Close } from "@element-plus/icons-vue";
import type { UseWizardReturn } from "@/composables/useWizard";
import { aiApi } from "@/api/ai";

interface Props {
  wizard: UseWizardReturn;
}

const props = defineProps<Props>();

const newQuestion = ref("");
const newAnswer = ref("");
const editingId = ref<string | null>(null);
const editingAnswer = ref("");

const handleAddQuestion = () => {
  if (!newQuestion.value.trim()) {
    ElMessage.warning("请输入问题内容");
    return;
  }
  props.wizard.addQuestion(newQuestion.value.trim(), newAnswer.value.trim());
  newQuestion.value = "";
  newAnswer.value = "";
};

const handleEditAnswer = (id: string, currentAnswer: string) => {
  editingId.value = id;
  editingAnswer.value = currentAnswer;
};

const handleSaveAnswer = (id: string) => {
  props.wizard.answerQuestion(id, editingAnswer.value.trim());
  editingId.value = null;
  editingAnswer.value = "";
};

const handleCancelEdit = () => {
  editingId.value = null;
  editingAnswer.value = "";
};

const handleDeleteQuestion = (id: string) => {
  props.wizard.deleteQuestion(id);
};

const handleGenerate = async () => {
  if (!props.wizard.rawRequirement.value) {
    ElMessage.error("缺少原始需求数据");
    return;
  }

  props.wizard.setIsGenerating(true);

  try {
    const result = await aiApi.generateFromRaw(
      props.wizard.rawRequirement.value.id
    );
    props.wizard.setGeneratedRequirement({
      id: result.id || crypto.randomUUID(),
      title: result.title || "未命名需求",
      description: result.description || "",
      priority: result.priority || "medium",
      acceptanceCriteria: result.acceptanceCriteria || [],
      userStories: result.userStories || [],
    });
    ElMessage.success("需求生成成功");
  } catch (error) {
    ElMessage.error((error as Error).message || "生成失败");
  } finally {
    props.wizard.setIsGenerating(false);
  }
};
</script>

<template>
  <div class="question-list-step">
    <div class="step-intro">
      <h3>问题澄清</h3>
      <p>回答以下问题以帮助 AI 更好地理解您的需求。您可以添加额外的问题或跳过不需要回答的问题。</p>
    </div>

    <div class="question-stats">
      <el-tag type="warning" size="large">
        {{ wizard.pendingQuestions.value.length }} 个问题待回答
      </el-tag>
      <el-tag type="success" size="large">
        {{ wizard.answeredQuestions.value.length }} 个问题已回答
      </el-tag>
      <el-tag v-if="wizard.deletedQuestions.value.length > 0" type="info" size="large">
        {{ wizard.deletedQuestions.value.length }} 个问题已跳过
      </el-tag>
    </div>

    <div class="add-question-form">
      <el-input
        v-model="newQuestion"
        placeholder="添加新问题（可选）"
        size="large"
      >
        <template #prepend>
          <el-icon><Edit /></el-icon>
        </template>
      </el-input>
      <el-input
        v-model="newAnswer"
        placeholder="同时回答此问题（可选）"
        size="large"
      />
      <el-button
        type="primary"
        :icon="Plus"
        size="large"
        @click="handleAddQuestion"
      >
        添加问题
      </el-button>
    </div>

    <div class="questions-list">
      <div
        v-for="qa in wizard.questions.value.filter((q) => !q.isDeleted)"
        :key="qa.id"
        class="question-item"
        :class="{
          answered: qa.isAnswered,
          'manually-added': qa.isManuallyAdded,
        }"
      >
        <div class="question-badge">
          <el-tag v-if="qa.isManuallyAdded" type="info" size="small">
            手动添加
          </el-tag>
        </div>

        <div class="question-content">
          <div class="question-text">
            <span class="q-label">Q:</span>
            {{ qa.question }}
          </div>

          <div v-if="qa.isAnswered" class="answer-text">
            <span class="a-label">A:</span>
            {{ qa.answer }}
          </div>
        </div>

        <div class="question-actions">
          <template v-if="editingId === qa.id">
            <el-input
              v-model="editingAnswer"
              type="textarea"
              :rows="2"
              placeholder="输入回答..."
              size="small"
            />
            <el-button
              type="success"
              :icon="Check"
              size="small"
              @click="handleSaveAnswer(qa.id)"
            >
              保存
            </el-button>
            <el-button
              type="info"
              :icon="Close"
              size="small"
              @click="handleCancelEdit"
            >
              取消
            </el-button>
          </template>
          <template v-else>
            <el-button
              v-if="!qa.isAnswered"
              type="primary"
              size="small"
              @click="handleEditAnswer(qa.id, qa.answer)"
            >
              回答
            </el-button>
            <el-button
              v-else
              type="warning"
              size="small"
              @click="handleEditAnswer(qa.id, qa.answer)"
            >
              编辑回答
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              @click="handleDeleteQuestion(qa.id)"
            >
              {{ qa.isAnswered ? "删除" : "跳过" }}
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <div
      v-if="wizard.deletedQuestions.value.length > 0"
      class="skipped-section"
    >
      <div class="section-title">已跳过的问题</div>
      <div
        v-for="qa in wizard.deletedQuestions.value"
        :key="qa.id"
        class="skipped-item"
      >
        <span class="q-label">Q:</span>
        {{ qa.question }}
        <el-button
          type="text"
          size="small"
          @click="wizard.updateQuestion(qa.id, { isDeleted: false })"
        >
          恢复
        </el-button>
      </div>
    </div>

    <div class="generate-section">
      <el-button
        type="primary"
        size="large"
        :disabled="!wizard.canGenerate.value"
        :loading="wizard.isGenerating.value"
        @click="handleGenerate"
      >
        {{ wizard.isGenerating.value ? "生成中..." : "生成需求" }}
      </el-button>
      <p class="generate-hint">
        至少回答一个问题后可以生成需求
      </p>
    </div>
  </div>
</template>

<style scoped>
.question-list-step {
  max-width: 800px;
  margin: 0 auto;
}

.step-intro {
  text-align: center;
  margin-bottom: 24px;
}

.step-intro h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.step-intro p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.6;
}

.question-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.add-question-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 24px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.question-item:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.question-item.answered {
  background: #f0fdf4;
  border-color: #10b981;
}

.question-item.manually-added {
  border-left: 3px solid #8b5cf6;
}

.question-badge {
  display: flex;
  gap: 8px;
}

.question-content {
  flex: 1;
}

.question-text,
.answer-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
}

.question-text {
  color: #1e293b;
}

.answer-text {
  color: #64748b;
  padding-left: 16px;
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

.question-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.question-actions :deep(.el-textarea) {
  flex: 1;
  min-width: 200px;
}

.skipped-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed #e2e8f0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px;
}

.skipped-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 8px;
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 14px;
}

.generate-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.generate-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}
</style>
