<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  View,
  Delete,
  RefreshRight,
  ArrowRight,
  ChatDotRound,
} from "@element-plus/icons-vue";
import { aiApi } from "@/api/ai";
import type { RawRequirementResponseDto } from "@/api/rawRequirements";
import { RawRequirementStatus } from "@/api/rawRequirements";
import { AiSubmit } from "@/components/ai-submit";
import { RequirementChat } from "@/components/requirement-chat";
import { AiSubmitRequestDto, GenerateRawRequirementDto } from "@req2task/dto";

const router = useRouter();
const route = useRoute();

const projectId = route.params.id as string;

const requirements = ref<RawRequirementResponseDto[]>([]);
const isGenerating = ref<string | null>(null);
const chatRawRequirement = ref<RawRequirementResponseDto | null>(null);

interface GeneratedRequirement {
  id: string;
  title: string;
  description: string;
  priority: string;
  rawRequirementId: string;
}

const generatedRequirements = ref<GeneratedRequirement[]>([]);

const handleAiSubmitSuccess = async (data: unknown) => {
  const result = data as RawRequirementResponseDto;
  if (result?.id) {
    if (result.questionAndAnswers && result.questionAndAnswers.length > 0) {
      chatRawRequirement.value = result;
    } else {
      requirements.value.unshift(result);
      ElMessage.success("原始需求已录入");
    }
  }
};

const handleAiSubmitError = (error: Error) => {
  ElMessage.error(error.message || "提交失败");
};

const handleDelete = (id: string) => {
  requirements.value = requirements.value.filter((r) => r.id !== id);
  generatedRequirements.value = generatedRequirements.value.filter(
    (g) => g.rawRequirementId !== id,
  );
  if (chatRawRequirement.value?.id === id) {
    chatRawRequirement.value = null;
  }
};

const handleOpenChat = (rawRequirement: RawRequirementResponseDto) => {
  chatRawRequirement.value = rawRequirement;
};

const handleCloseChat = () => {
  chatRawRequirement.value = null;
};

const handleChatComplete = async (
  _qaItems: Array<{ question: string; answer: string }>,
) => {
  if (!chatRawRequirement.value) return;

  isGenerating.value = chatRawRequirement.value.id;
  try {
    const result = await aiApi.generateFromRaw(chatRawRequirement.value.id);
    generatedRequirements.value.push({
      id: result.id || crypto.randomUUID(),
      title: result.title || "未命名需求",
      description: result.description || "",
      priority: result.priority || "medium",
      rawRequirementId: chatRawRequirement.value.id,
    });

    requirements.value = requirements.value.filter(
      (r) => r.id !== chatRawRequirement.value?.id,
    );
    chatRawRequirement.value = null;
    ElMessage.success("需求生成成功");
  } catch (error) {
    ElMessage.error((error as Error).message || "生成失败");
  } finally {
    isGenerating.value = null;
  }
};

const handleGenerate = async (rawRequirement: RawRequirementResponseDto) => {
  isGenerating.value = rawRequirement.id;
  try {
    const result = await aiApi.generateFromRaw(rawRequirement.id);
    generatedRequirements.value.push({
      id: result.id || crypto.randomUUID(),
      title: result.title || "未命名需求",
      description: result.description || "",
      priority: result.priority || "medium",
      rawRequirementId: rawRequirement.id,
    });
    ElMessage.success("需求生成成功");
  } catch (error) {
    ElMessage.error((error as Error).message || "生成失败");
  } finally {
    isGenerating.value = null;
  }
};

const handleViewDetail = (requirement: GeneratedRequirement) => {
  router.push({
    name: "requirementDetail",
    params: { id: requirement.id },
  });
};

const getPriorityType = (priority: string) => {
  const map: Record<string, string> = {
    critical: "danger",
    high: "warning",
    medium: "primary",
    low: "info",
  };
  return map[priority.toLowerCase()] || "info";
};

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    critical: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[priority.toLowerCase()] || priority;
};

const getStatusType = (status: RawRequirementStatus) => {
  const map: Record<RawRequirementStatus, string> = {
    [RawRequirementStatus.PENDING]: "warning",
    [RawRequirementStatus.PROCESSING]: "primary",
    [RawRequirementStatus.COMPLETED]: "success",
    [RawRequirementStatus.CLARIFIED]: "success",
    [RawRequirementStatus.CONVERTED]: "info",
    [RawRequirementStatus.DISCARDED]: "info",
    [RawRequirementStatus.FAILED]: "danger",
  };
  return map[status] || "info";
};

const getStatusLabel = (status: RawRequirementStatus) => {
  const map: Record<RawRequirementStatus, string> = {
    [RawRequirementStatus.PENDING]: "待澄清",
    [RawRequirementStatus.PROCESSING]: "处理中",
    [RawRequirementStatus.COMPLETED]: "已完成",
    [RawRequirementStatus.CLARIFIED]: "已澄清",
    [RawRequirementStatus.CONVERTED]: "已转换",
    [RawRequirementStatus.DISCARDED]: "已废弃",
    [RawRequirementStatus.FAILED]: "失败",
  };
  return map[status] || status;
};
const translRequestData = (
  data: AiSubmitRequestDto,
): GenerateRawRequirementDto => {

  return {
    conversationText: data.message,

    //previousQuestions?: RawRequirementQADto[];
  } as GenerateRawRequirementDto;
};
</script>

<template>
  <div class="raw-requirement-create">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="router.back()">返回</el-button>
        <h2 class="page-title">录入原始需求</h2>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :span="10">
        <el-card class="input-card">
          <template #header>
            <span class="card-title">原始需求录入</span>
          </template>
          <AiSubmit
            :url="`/api/raw-requirements/${projectId}/stream`"
            :upload-file="true"
            :use-stream="true"
            message-key="conversationText"
            placeholder="描述您的需求或问题，AI 将为您分析和处理..."
            @success="handleAiSubmitSuccess"
            @error="handleAiSubmitError"
            :trans-request="translRequestData"
          />
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="result-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">已录入的原始需求</span>
              <span class="requirement-count"
                >{{ requirements.length }} 条</span
              >
            </div>
          </template>

          <div v-if="requirements.length === 0" class="empty-state">
            <el-empty description="暂无录入的原始需求">
              <template #image>
                <div style="font-size: 48px; color: #c0c4cc">📝</div>
              </template>
            </el-empty>
          </div>

          <div v-else class="requirement-list">
            <div
              v-for="req in requirements"
              :key="req.id"
              class="requirement-item"
            >
              <div class="requirement-content">
                <div class="content-text">{{ req.content }}</div>
                <div class="content-meta">
                  <el-tag :type="getStatusType(req.status)" size="small">
                    {{ getStatusLabel(req.status) }}
                  </el-tag>
                  <span class="meta-time">
                    {{ new Date(req.createdAt).toLocaleString() }}
                  </span>
                </div>
              </div>

              <div class="requirement-actions">
                <el-button
                  v-if="
                    req.questionAndAnswers && req.questionAndAnswers.length > 0
                  "
                  type="success"
                  :icon="ChatDotRound"
                  size="small"
                  @click="handleOpenChat(req)"
                >
                  追问对话
                </el-button>
                <el-button
                  type="primary"
                  :icon="RefreshRight"
                  size="small"
                  :loading="isGenerating === req.id"
                  @click="handleGenerate(req)"
                >
                  生成需求
                </el-button>
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  @click="handleDelete(req.id)"
                />
              </div>

              <div
                v-if="
                  generatedRequirements.some(
                    (g) => g.rawRequirementId === req.id,
                  )
                "
                class="generated-section"
              >
                <div class="section-divider">
                  <span>生成的需求</span>
                </div>
                <div
                  v-for="gen in generatedRequirements.filter(
                    (g) => g.rawRequirementId === req.id,
                  )"
                  :key="gen.id"
                  class="generated-item"
                >
                  <div class="generated-info">
                    <div class="generated-title">
                      <span class="title-text">{{ gen.title }}</span>
                      <el-tag
                        :type="getPriorityType(gen.priority)"
                        size="small"
                      >
                        {{ getPriorityLabel(gen.priority) }}
                      </el-tag>
                    </div>
                    <div class="generated-desc">{{ gen.description }}</div>
                  </div>
                  <div class="generated-actions">
                    <el-button
                      type="primary"
                      link
                      :icon="View"
                      @click="handleViewDetail(gen)"
                    >
                      查看详情
                    </el-button>
                    <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="chatRawRequirement"
      title="智能追问对话"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <RequirementChat
        v-if="chatRawRequirement"
        :raw-requirement="chatRawRequirement"
        @complete="handleChatComplete"
        @close="handleCloseChat"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.raw-requirement-create {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.requirement-count {
  font-size: 14px;
  color: #64748b;
}

.empty-state {
  padding: 60px 0;
}

.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requirement-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.requirement-content {
  margin-bottom: 12px;
}

.content-text {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
  white-space: pre-wrap;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.meta-time {
  font-size: 12px;
  color: #94a3b8;
}

.requirement-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.generated-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #6366f1;
  font-weight: 500;
}

.generated-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e5ff;
  margin-bottom: 8px;
}

.generated-item:last-child {
  margin-bottom: 0;
}

.generated-info {
  flex: 1;
  min-width: 0;
}

.generated-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.generated-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.generated-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.arrow-icon {
  color: #6366f1;
  font-size: 16px;
}
</style>
