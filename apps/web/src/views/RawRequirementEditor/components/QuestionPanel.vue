<template>
  <div class="space-y-3">
    <div
      v-for="(qa, index) in questions"
      :key="qa.id"
      class="rounded-lg border transition-all cursor-pointer"
      :class="getCardClass(qa)"
      @click="handleCardClick(qa)"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-3">
        <div class="flex items-center gap-2">
          <div
            class="flex items-center justify-center w-6 h-6 rounded text-xs font-semibold"
            :class="getBadgeClass(qa)"
          >
            Q{{ index + 1 }}
          </div>
          <span class="text-xs font-medium" :class="getStatusTextClass(qa)">
            {{ getStatusText(qa) }}
          </span>
        </div>
        <Badge
          v-if="getStatusTag(qa)"
          variant="outline"
          class="text-xs h-5"
          :class="getTagClass(qa)"
        >
          {{ getStatusTag(qa) }}
        </Badge>
      </div>

      <!-- Content -->
      <div class="px-3 pb-3">
        <p class="text-sm font-medium text-foreground mb-2">
          {{ qa.question }}
        </p>

        <!-- Purpose -->
        <div
          v-if="qa.purpose"
          class="text-xs rounded-md p-2 mb-2"
          :class="getPurposeClass(qa)"
        >
          <span class="font-medium">目的:</span> {{ qa.purpose }}
        </div>

        <!-- Answer Input (when selected) -->
        <div v-if="isSelected(qa)" class="space-y-2 mt-3" @click.stop>
          <Textarea
            v-model="currentAnswer"
            placeholder="请输入您的回答..."
            :rows="3"
            class="resize-none"
          />
          <div class="flex gap-2 justify-end">
            <Button variant="outline" size="sm" @click.stop="handleSkip(qa.id)">
              跳过
            </Button>
            <Button size="sm" @click.stop="handleSubmit(qa.id)">
              提交回答
            </Button>
          </div>
        </div>

        <!-- Skipped Hint -->
        <div
          v-else-if="isSkipped(qa)"
          class="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2 mt-2"
        >
          <AlertCircle class="h-3.5 w-3.5" />
          <span>此问题已跳过，将在下次提交时保留</span>
        </div>

        <!-- Answered Display -->
        <div
          v-else-if="isAnswered(qa)"
          class="text-xs text-chart-3 bg-chart-3/10 rounded-md p-2 mt-2"
        >
          {{ qa.answer }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="questions.length === 0"
      class="text-center py-8 text-muted-foreground"
    >
      <HelpCircle class="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p class="text-sm">暂无问题</p>
      <p class="text-xs">点击"分析"按钮生成问题</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { RawRequirementQADto } from "@req2task/dto";
import { useRawRequirementCreateStore } from "../store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, AlertCircle } from "lucide-vue-next";

interface Props {
  projectId: string;
  store: ReturnType<typeof useRawRequirementCreateStore>;
}

const props = defineProps<Props>();

const questions = computed(() => props.store.visibleQuestions || []);
const selectedId = ref<string | null>(null);
const currentAnswer = ref("");

const isAnswered = (qa: RawRequirementQADto) => {
  return qa.answer !== null && qa.answer !== "" && qa.answer !== undefined;
};

const isSkipped = (qa: RawRequirementQADto) => {
  return props.store.deletedQuestionIds.has(qa.id);
};

const isSelected = (qa: RawRequirementQADto) => {
  return selectedId.value === qa.id;
};

const getStatusText = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return !qa.answer ? "待回答" : "已回答";
  if (isSkipped(qa)) return "已跳过";
  if (isAnswered(qa)) return "已回答";
  return "待回答";
};

const getStatusTag = (qa: RawRequirementQADto) => {
  if (isSkipped(qa)) return "已跳过";
  if (isAnswered(qa)) return "已回答";
  return null;
};

const getCardClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "border-primary bg-primary/5";
  if (isSkipped(qa)) return "border-destructive/30 bg-destructive/5";
  if (isAnswered(qa)) return "border-chart-3/30 bg-chart-3/5";
  return "border-border hover:border-muted-foreground/50";
};

const getBadgeClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "bg-primary text-primary-foreground";
  if (isSkipped(qa)) return "bg-destructive/20 text-destructive";
  if (isAnswered(qa)) return "bg-chart-3/20 text-chart-3";
  return "bg-muted text-muted-foreground";
};

const getStatusTextClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "text-primary";
  if (isSkipped(qa)) return "text-destructive";
  if (isAnswered(qa)) return "text-chart-3";
  return "text-muted-foreground";
};

const getTagClass = (qa: RawRequirementQADto) => {
  if (isSkipped(qa)) return "border-destructive/30 text-destructive";
  if (isAnswered(qa)) return "border-chart-3/30 text-chart-3";
  return "";
};

const getPurposeClass = (qa: RawRequirementQADto) => {
  if (isSelected(qa)) return "bg-primary/10 text-primary";
  if (isSkipped(qa)) return "bg-destructive/10 text-destructive";
  if (isAnswered(qa)) return "bg-chart-3/10 text-chart-3";
  return "bg-muted text-muted-foreground";
};

const handleCardClick = (qa: RawRequirementQADto) => {
  selectedId.value = qa.id;
  currentAnswer.value = qa.answer || "";
};

const handleSkip = (id: string) => {
  props.store.deleteQuestion(id);
  selectedId.value = null;
  currentAnswer.value = "";
};

const handleSubmit = (id: string) => {
  if (currentAnswer.value.trim()) {
    props.store.answerQuestion(id, currentAnswer.value.trim());
    selectedId.value = null;
    currentAnswer.value = "";
  }
};
</script>
