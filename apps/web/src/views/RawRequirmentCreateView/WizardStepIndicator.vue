<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";

interface Step {
  step: number;
  title: string;
  icon: string;
}

interface Props {
  currentStep: number;
  steps: Step[];
}

const props = defineProps<Props>();

const getStepStatus = (step: number) => {
  if (step < props.currentStep) return "completed";
  if (step === props.currentStep) return "active";
  return "pending";
};
</script>

<template>
  <div class="step-indicator">
    <div
      v-for="(item, index) in steps"
      :key="item.step"
      class="step-item"
      :class="getStepStatus(item.step)"
    >
      <div class="step-circle">
        <el-icon v-if="getStepStatus(item.step) === 'completed'">
          <Check />
        </el-icon>
        <span v-else>{{ item.step }}</span>
      </div>
      <span class="step-title">{{ item.title }}</span>
      <div v-if="index < steps.length - 1" class="step-line" />
    </div>
  </div>
</template>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step-item {
  display: flex;
  align-items: center;
  position: relative;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step-title {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step-line {
  width: 60px;
  height: 2px;
  margin: 0 16px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.step-item.completed .step-circle {
  background: #10b981;
  color: white;
}

.step-item.completed .step-title {
  color: #10b981;
}

.step-item.completed .step-line {
  background: #10b981;
}

.step-item.active .step-circle {
  background: #6366f1;
  color: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.step-item.active .step-title {
  color: #6366f1;
}

.step-item.pending .step-circle {
  background: #f1f5f9;
  color: #94a3b8;
  border: 2px solid #e2e8f0;
}

.step-item.pending .step-title {
  color: #94a3b8;
}
</style>
