<script setup lang="ts">
import { ElMessage } from "element-plus";
import { AiSubmit } from "@/components/ai-submit";
import type { UseWizardReturn } from "@/composables/useWizard";
import type { RawRequirementResponseDto } from "@req2task/dto";
import { AiSubmitRequestDto, GenerateRawRequirementDto } from "@req2task/dto";

interface Props {
  projectId: string;
  wizard: UseWizardReturn;
}

const props = defineProps<Props>();

const handleSuccess = (data: unknown) => {
  const result = data as RawRequirementResponseDto;
  if (result?.id) {
    props.wizard.setRawRequirement(result);
    if (result.questionAndAnswers && result.questionAndAnswers.length > 0) {
      ElMessage.success("需求已录入，发现追问问题");
    } else {
      ElMessage.success("需求已录入");
    }
  }
};

const handleError = (error: Error) => {
  ElMessage.error(error.message || "提交失败");
};

const translRequestData = (
  data: AiSubmitRequestDto
): GenerateRawRequirementDto => {
  return {
    conversationText: data.message,
  } as GenerateRawRequirementDto;
};
</script>

<template>
  <div class="raw-requirement-input-step">
    <div class="step-intro">
      <h3>录入原始需求</h3>
      <p>描述您的需求或问题，AI 将为您分析和处理。如果需要，AI 会生成追问问题帮助澄清需求。</p>
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
    />

    <div v-if="wizard.hasQuestions.value" class="questions-hint">
      <el-icon><ChatDotRound /></el-icon>
      <span>已检测到追问问题，将自动进入问题澄清步骤</span>
    </div>
  </div>
</template>

<script lang="ts">
import { ChatDotRound } from "@element-plus/icons-vue";
export default {
  components: { ChatDotRound },
};
</script>

<style scoped>
.raw-requirement-input-step {
  max-width: 700px;
  margin: 0 auto;
}

.step-intro {
  margin-bottom: 24px;
  text-align: center;
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

.questions-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 8px;
  color: #059669;
  font-size: 14px;
}
</style>
