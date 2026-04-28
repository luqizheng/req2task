<template>
  <div class="app-card">
    <div class="card-header">
      <div class="header-left">
        <div class="card-icon">
          <slot name="icon">
            <el-icon :size="16">
              <ChatDotRound />
            </el-icon>
          </slot>
        </div>
        <span class="card-title">{{ title }}</span>
      </div>
      <div class="header-right">
        <slot name="extra">
          <!-- <span v-if="questionCount" class="question-badge">{{ questionCount }} 个问题</span>
          <span v-if="hasProgress" class="step-indicator">步骤 {{ currentStep }}/{{ totalSteps }}</span> -->
        </slot>
      </div>
    </div>

    <div v-if="hasProgress" class="progress-bar">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>

    <div class="divider-line"></div>

    <div v-if="$slots.default" class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChatDotRound } from "@element-plus/icons-vue";

interface Props {
  title: string;

  currentStep?: number;
  totalSteps?: number;
}

const props = defineProps<Props>();

const hasProgress = computed(() => {
  return props.currentStep !== undefined && props.totalSteps !== undefined;
});

const progressPercent = computed(() => {
  if (!hasProgress.value) return 0;
  return Math.round((props.currentStep! / props.totalSteps!) * 100);
});
</script>

<style scoped>
.app-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  background-color: #ffffff;
  border-right: 1px solid #e4e4e7;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #18181b;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
  white-space: pre;
}

.header-right {
  gap: 8px;
}

.question-badge {
  padding: 4px 8px;
  border-radius: 6px;
  background-color: #f4f4f5;
  font-size: 12px;
  font-weight: 500;
  color: #71717a;
}

.step-indicator {
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
}

.progress-bar {
  width: 100%;
}

.progress-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background-color: #f4f4f5;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  background-color: #2563eb;
  transition: width 0.3s ease;
}

.divider-line {
  width: 100%;
  height: 1px;
  background-color: #e4e4e7;
}

.card-content {
  font-size: 14px;
  color: #18181b;
}
</style>
