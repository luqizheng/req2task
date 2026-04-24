<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete, Edit, Check, Close } from "@element-plus/icons-vue";
import { AiSubmit } from "@/components/ai-submit";
import { useRawRequirementCreateStore } from "./store";
import type { AiQuestion } from "./store";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { AiSubmitRequestDto, GenerateRawRequirementDto } from "@req2task/dto";
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
      null as unknown as RawRequirementResponseDto,
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
  return {
    conversationText: data.message,
  } as GenerateRawRequirementDto;
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
  props.store.answerQuestion(id, editingAnswer.value.trim());
  editingId.value = null;
  editingAnswer.value = "";
};

const handleCancelEdit = () => {
  editingId.value = null;
  editingAnswer.value = "";
};

const handleDeleteQuestion = (id: string) => {
  props.store.deleteQuestion(id);
};

const handleGenerate = async () => {
  if (!props.store.rawRequirement) {
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
      <h3 class="panel-title">录入原始需求</h3>
      <p class="panel-desc">
        描述您的需求或问题，AI 将为您分析和处理。如果需要，AI
        会生成追问问题帮助澄清需求。
      </p>

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
          <h3 class="panel-title">问题澄清</h3>
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
          <el-input
            v-model="newQuestion"
            placeholder="添加新问题（可选）"
            size="default"
          >
            <template #prepend>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>
          <el-input
            v-model="newAnswer"
            placeholder="同时回答此问题（可选）"
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

        <div class="questions-list">
          <div
            v-for="qa in store.questions.filter((q) => !q.isDeleted)"
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
              <div v-if="qa.purpose" class="purpose-text">
                <span class="p-label">目的:</span>
                {{ qa.purpose }}
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
          v-if="store.deletedQuestions.length > 0"
          class="skipped-section"
        >
          <div class="section-title">已跳过的问题</div>
          <div
            v-for="qa in store.deletedQuestions"
            :key="qa.id"
            class="skipped-item"
          >
            <span class="q-label">Q:</span>
            {{ qa.question }}
            <el-button
              type="text"
              size="small"
              @click="store.updateQuestion(qa.id, { isDeleted: false })"
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
  gap: 24px;
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
  gap: 16px;
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 24px;
  border-left: 1px solid #e2e8f0;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.panel-desc {
  font-size: 14px;
  color: #64748b;
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
  gap: 8px;
}

.add-question-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 400px;
  padding-right: 4px;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
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
  margin-bottom: 4px;
}

.question-text {
  color: #1e293b;
}

.purpose-text {
  font-size: 13px;
  color: #8b5cf6;
  padding-left: 16px;
  margin-bottom: 4px;
}

.p-label {
  font-weight: 600;
  margin-right: 4px;
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
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}

.skipped-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 6px;
  color: #94a3b8;
  text-decoration: line-through;
  font-size: 13px;
}

.generate-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.generate-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.empty-questions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}
</style>
