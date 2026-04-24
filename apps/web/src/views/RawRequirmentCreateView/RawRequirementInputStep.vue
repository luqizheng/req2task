<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Delete, Edit, Check, Close } from "@element-plus/icons-vue";
import { AiSubmit } from "@/components/ai-submit";
import { useRawRequirementCreateStore } from "./store";
import type { AiQuestion } from "./store";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { AiSubmitRequestDto, GenerateRawRequirementDto, CollectionType } from "@req2task/dto";
import { aiApi } from "@/api/ai";
import { useJsonStream } from "@/utils/useJson";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();

const newQuestion = ref("");
const newAnswer = ref("");
const editingId = ref<string | null>(null);
const editingAnswer = ref("");

const collectionTypeOptions = [
  { label: '会议', value: CollectionType.MEETING },
  { label: '访谈', value: CollectionType.INTERVIEW },
  { label: '文档', value: CollectionType.DOCUMENT },
  { label: '其他', value: CollectionType.OTHER },
];

const handleSuccess = (data: unknown) => {
  if (!data) {
    ElMessage.warning("未收到有效数据");
    return;
  }

  if ((data as RawRequirementResponseDto)?.id) {
    const result = data as RawRequirementResponseDto;
    props.store.setRawRequirement(result);
    if (result.questionAndAnswers && result.questionAndAnswers.length > 0) {
      ElMessage.success("需求已录入，发现追问问题");
    } else {
      ElMessage.success("需求已录入");
    }
  } else if ((data as { questions?: AiQuestion[] })?.questions) {
    const sseData = data as {
      keyElements?: string[];
      questions?: AiQuestion[];
    };
    props.store.setQuestionsFromSSE(
      null,
      sseData,
    );
    ElMessage.success("需求已录入，发现追问问题");
  }
};

const handleError = (error: Error) => {
  ElMessage.error(error.message || "提交失败");
};

const translRequestData = (
  data: AiSubmitRequestDto,
): GenerateRawRequirementDto => {
  const source = props.store.rawRequirement.source?.trim();
  if (!source) {
    throw new Error('请填写需求来源');
  }
  const dto: GenerateRawRequirementDto = {
    conversationText: data.message.trim(),
    source,
  };
  if (props.store.rawRequirement.collectionType) {
    dto.collectionType = props.store.rawRequirement.collectionType;
  }
  if (props.store.rawRequirement.collectTime) {
    dto.collectTime = props.store.rawRequirement.collectTime;
  }
  return dto;
};

const jsonHelper = useJsonStream([
  {
    trigger: "questions",
    onArrayItem(item) {
      props.store.addQuestionFromSSE(item as AiQuestion);
    },
  },
]);

const handleData = (data: string) => {
  jsonHelper.feed(data);
};

const handleAddQuestion = () => {
  if (!newQuestion.value.trim()) {
    ElMessage.warning("请输入问题内容");
    return;
  }
  props.store.addQuestion(newQuestion.value.trim(), newAnswer.value.trim());
  newQuestion.value = "";
  newAnswer.value = "";
};

const handleEditAnswer = (id: string, currentAnswer: string) => {
  editingId.value = id;
  editingAnswer.value = currentAnswer;
};

const handleSaveAnswer = (id: string) => {
  if (!editingAnswer.value.trim()) {
    ElMessage.warning("请输入回答内容");
    return;
  }
  props.store.answerQuestion(id, editingAnswer.value.trim());
  editingId.value = null;
  editingAnswer.value = "";
};

const handleCancelEdit = () => {
  editingId.value = null;
  editingAnswer.value = "";
};

const handleDeleteQuestion = async (id: string) => {
  const qa = props.store.visibleQuestions.find((q) => q.id === id);
  const actionLabel = qa?.answer ? "删除" : "跳过";

  try {
    await ElMessageBox.confirm(
      `确定要${actionLabel}该问题吗？`,
      "确认操作",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
    props.store.deleteQuestion(id);
  } catch {
    // 用户取消
  }
};

const handleGenerate = async () => {
  if (!props.store.rawRequirement.id) {
    ElMessage.error("缺少原始需求数据");
    return;
  }

  props.store.setIsGenerating(true);

  try {
    const result = await aiApi.generateFromRaw(
      props.store.rawRequirement.id
    );
    props.store.setGeneratedRequirement({
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
    props.store.setIsGenerating(false);
  }
};
</script>

<template>
  <div class="input-and-questions">
    <div class="panel panel-left">
      <h2 class="panel-title">录入原始需求</h2>
      <p class="panel-desc">
        描述您的需求或问题，AI 将为您分析和处理。如果需要，AI
        会生成追问问题帮助澄清需求。
      </p>

      <div class="meta-form">
        <div class="meta-field">
          <label class="form-label" for="source-input">需求来源 <span class="required">*</span></label>
          <el-input
            id="source-input"
            v-model="props.store.rawRequirement.source"
            placeholder="如：客户会议、产品文档等"
            size="default"
            clearable
          />
        </div>
        <div class="meta-field">
          <label class="form-label" for="collection-type-input">采集方式</label>
          <el-select
            id="collection-type-input"
            v-model="props.store.rawRequirement.collectionType"
            placeholder="选择采集方式"
            size="default"
            clearable
          >
            <el-option
              v-for="opt in collectionTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="meta-field">
          <label class="form-label" for="collect-time-input">收集时间</label>
          <el-date-picker
            id="collect-time-input"
            v-model="props.store.rawRequirement.collectTime"
            type="datetime"
            placeholder="选择收集时间"
            size="default"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            clearable
          />
        </div>
      </div>

      <AiSubmit
        :url="`/api/raw-requirements/${projectId}/stream`"
        :upload-file="true"
        :use-stream="true"
        message-key="conversationText"
        placeholder="描述您的需求或问题，AI 将为您分析和处理..."
        @success="handleSuccess"
        @error="handleError"
        :trans-request="translRequestData"
        @content="handleData"
      />
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

        <div class="add-question-form">
          <label class="form-label" for="new-question-input">添加新问题（可选）</label>
          <el-input
            id="new-question-input"
            v-model="newQuestion"
            placeholder="输入问题内容"
            size="default"
          >
            <template #prepend>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>
          <label class="form-label" for="new-answer-input">同时回答此问题（可选）</label>
          <el-input
            id="new-answer-input"
            v-model="newAnswer"
            placeholder="输入回答内容"
            size="default"
          />
          <el-button
            type="primary"
            :icon="Plus"
            size="default"
            @click="handleAddQuestion"
          >
            添加
          </el-button>
        </div>

        <div class="questions-list" role="list" aria-label="问题列表">
          <div
            v-for="qa in store.visibleQuestions"
            :key="qa.id"
            class="question-item"
            :class="{
              answered: !!qa.answer,
            }"
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
                  v-model="editingAnswer"
                  type="textarea"
                  :rows="2"
                  placeholder="输入回答..."
                  size="small"
                  aria-label="编辑回答"
                />
                <el-button
                  type="success"
                  :icon="Check"
                  size="small"
                  aria-label="保存回答"
                  @click="handleSaveAnswer(qa.id)"
                >
                  保存
                </el-button>
                <el-button
                  type="info"
                  :icon="Close"
                  size="small"
                  aria-label="取消编辑"
                  @click="handleCancelEdit"
                >
                  取消
                </el-button>
              </template>
              <template v-else>
                <el-button
                  v-if="!qa.answer"
                  type="primary"
                  size="small"
                  @click="handleEditAnswer(qa.id, qa.answer ?? '')"
                >
                  回答
                </el-button>
                <el-button
                  v-else
                  type="warning"
                  size="small"
                  @click="handleEditAnswer(qa.id, qa.answer ?? '')"
                >
                  编辑回答
                </el-button>
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  :aria-label="qa.answer ? '删除问题' : '跳过问题'"
                  @click="handleDeleteQuestion(qa.id)"
                >
                  {{ qa.answer ? "删除" : "跳过" }}
                </el-button>
              </template>
            </div>
          </div>
        </div>

        <div
          v-if="store.deletedQuestions.length > 0"
          class="skipped-section"
        >
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

        <div class="generate-section">
          <el-button
            type="primary"
            size="large"
            :disabled="!store.canGenerate"
            :loading="store.isGenerating"
            @click="handleGenerate"
          >
            {{ store.isGenerating ? "生成中..." : "生成需求" }}
          </el-button>
          <p class="generate-hint">
            至少回答一个问题后可以生成需求
          </p>
        </div>
      </template>

      <template v-else>
        <div class="empty-questions">
          <el-empty description="AI 将在分析需求后生成追问问题" :image-size="80" />
        </div>
      </template>
    </div>
  </div>
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
  flex: 0 0 380px;
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

.meta-form {
  display: flex;
  gap: var(--spacing-compact, 8px);
}

.meta-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 4px;
  display: block;
}

.required {
  color: var(--color-danger, #ef4444);
}

.add-question-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-compact, 8px);
  padding: var(--spacing-component, 12px);
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 8px;
}

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

.generate-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-compact, 8px);
  margin-top: var(--spacing-component, 12px);
  padding-top: var(--spacing-component, 12px);
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.generate-hint {
  font-size: 13px;
  color: var(--color-text-placeholder, #94a3b8);
  margin: 0;
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

  .panel-left {
    flex: none;
    width: 100%;
  }

  .panel-right {
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border, #e2e8f0);
    padding-top: var(--spacing-component, 12px);
  }

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
