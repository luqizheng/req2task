<template>
  <div>
    <el-radio-group v-model="filter" style="margin-bottom: 12px">
      <el-radio-button value="all">所有</el-radio-button>
      <el-radio-button value="answered">已回答</el-radio-button>
      <el-radio-button value="pending">未回答</el-radio-button>
    </el-radio-group>

    <AppStatusCard
      v-for="(qa, index) in questions"
      :key="qa.id"
      :status="getCardStatus(qa)"
      :title="`Q${index + 1}`"
      :status-text="getStatusText(qa)"
      show-status-dot
      :clickable="!isAnswered(qa) && !isSkipped(qa)"
      @click="handleCardClick(qa)"
    >
      <div class="question-text">{{ qa.question }}</div>
      <AppInfo
        v-if="qa.purpose"
        :type="!qa.answer && !isSelected(qa) ? 'warning' : 'default'"
      >
        目的: {{ qa.purpose }}
      </AppInfo>

      <div v-if="isSelected(qa)" class="answer-section" @click.stop>
        <el-input
          v-model="currentAnswer"
          type="textarea"
          :rows="3"
          placeholder="请输入您的回答..."
          class="answer-input"
        />
        <div class="action-buttons">
          <el-button class="skip-btn" @click.stop="handleSkip">跳过</el-button>
          <el-button
            type="primary"
            class="submit-btn"
            @click.stop="handleSubmit"
            >提交回答</el-button
          >
        </div>
      </div>

      <div v-else-if="isSkipped(qa)" class="hint-section skipped">
        <SkipIcon class="hint-icon" />
        <span class="hint-text">此问题已跳过，将在下次提交时保留</span>
      </div>

      <div v-else-if="isAnswered(qa)" class="answer-display">
        <div class="answer-content">{{ qa.answer }}</div>
      </div>
    </AppStatusCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import type { RawRequirementQADto } from "@req2task/dto";
import { useRawRequirementCreateStore } from "../store";
import { AppStatusCard, AppInfo } from "@/components/common";
import { SkipIcon } from "@/components/icons";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();

const panelRef = ref<HTMLElement | null>(null);
const questions = computed(() => props.store.visibleQuestions || []);

const selectedId = ref<string | null>(null);
const currentAnswer = ref("");
const filter = computed({
  get: () => props.store.questionFilter || "all",
  set: (value) => {
    props.store.questionFilter = value;
  },
});

onClickOutside(panelRef, () => {
  if (selectedId.value) {
    selectedId.value = null;
    currentAnswer.value = "";
  }
});

const isAnswered = (qa: RawRequirementQADto) => {
  return qa.answer !== null && qa.answer !== "" && qa.answer !== undefined;
};

const isSkipped = (qa: RawRequirementQADto) => {
  return props.store.deletedQuestionIds.has(qa.id);
};

const isSelected = (qa: RawRequirementQADto) => {
  return selectedId.value === qa.id;
};

const getCardStatus = (
  qa: RawRequirementQADto,
): "default" | "success" | "warning" | "selected" => {
  if (isSelected(qa)) return "selected";
  if (isSkipped(qa) || !qa.answer) return "warning";
  if (isAnswered(qa)) return "success";
  return "default";
};

const getAppInfoType = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "info";
  if (isSkipped(qa)) return "warning";
  if (isAnswered(qa)) return "success";
  return "default";
};

const getPurposeClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "purpose-selected";
  return "purpose-default";
};

const getStatusText = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "待回答";
  if (isSkipped(qa)) return "已跳过";
  if (isAnswered(qa)) return "已回答";
  return "";
};

const handleCardClick = (qa: RawRequirementQADto) => {
  if (!isAnswered(qa) && !isSkipped(qa)) {
    selectedId.value = qa.id;
    currentAnswer.value = "";
  }
};

const handleSkip = () => {
  if (selectedId.value) {
    selectedId.value = null;
    currentAnswer.value = "";
  }
};

const handleSubmit = () => {
  if (selectedId.value && currentAnswer.value.trim()) {
    const currentAnswerIndex =
      props.store.rawRequirement.questionAndAnswers.findIndex(
        (qa) => qa.id === selectedId.value,
      );
    if (currentAnswerIndex !== -1) {
      props.store.rawRequirement.questionAndAnswers[currentAnswerIndex].answer =
        currentAnswer.value.trim();
    }

    selectedId.value = null;
    currentAnswer.value = "";
  }
};
</script>

<style scoped>
.question-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  padding: 16px 0;
  border-bottom: 1px solid #e4e4e4;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.questions-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-text {
  font-size: 13px;
  font-weight: 500;
  color: #18181b;
  line-height: 150%;
}

.purpose-tag {
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  align-self: flex-start;
}

.purpose-tag.purpose-default {
  background: #f8f8fa;
}

.purpose-tag.purpose-selected {
  background: #dbeafe;
}

.purpose-label {
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
}

.purpose-content {
  font-size: 12px;
  color: #71717a;
}

.purpose-selected .purpose-label {
  color: #60a5fa;
}

.purpose-selected .purpose-content {
  color: #2563eb;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.answer-input {
  border-radius: 8px;
}

.answer-input :deep(.el-textarea__inner) {
  border: 1.5px solid #2563eb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #a1a1aa;
}

.answer-input :deep(.el-textarea__inner:focus) {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.skip-btn {
  padding: 0 14px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e4e4e4;
  background: #fff;
  color: #71717a;
  font-size: 13px;
  font-weight: 500;
}

.skip-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.submit-btn {
  padding: 0 14px;
  height: 32px;
  border-radius: 6px;
  background: #2563eb;
  border: none;
  font-size: 13px;
  font-weight: 600;
}

.submit-btn:hover {
  background: #1d4ed8;
}

.hint-section {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
}

.hint-section.skipped {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.hint-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 2px;
  color: #d97706;
}

.hint-text {
  font-size: 12px;
  line-height: 150%;
  color: #d97706;
}

.answer-display {
  padding: 10px 12px;
  background: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.answer-content {
  font-size: 13px;
  line-height: 150%;
  color: #15803d;
}
</style>
