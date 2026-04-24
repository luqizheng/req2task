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
  <nav class="step-indicator" aria-label="向导步骤">
    <ol class="step-list">
      <li
        v-for="(item, index) in steps"
        :key="item.step"
        class="step-item"
        :class="getStepStatus(item.step)"
        :aria-current="getStepStatus(item.step) === 'active' ? 'step' : undefined"
      >
        <div class="step-circle" :aria-label="`步骤 ${item.step}: ${item.title}`">
          <el-icon v-if="getStepStatus(item.step) === 'completed'">
            <Check />
          </el-icon>
          <span v-else>{{ item.step }}</span>
        </div>
        <span class="step-title">{{ item.title }}</span>
        <div v-if="index < steps.length - 1" class="step-line" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  list-style: none;
  margin: 0;
  padding: 0;
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
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.step-title {
  margin-left: var(--spacing-compact, 8px);
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.step-line {
  width: 60px;
  height: 2px;
  margin: 0 var(--spacing-component, 12px);
  background: var(--color-border, #e2e8f0);
  transition: background 0.2s ease;
}

.step-item.completed .step-circle {
  background: var(--color-success, #10b981);
  color: white;
}

.step-item.completed .step-title {
  color: var(--color-success, #10b981);
}

.step-item.completed .step-line {
  background: var(--color-success, #10b981);
}

.step-item.active .step-circle {
  background: var(--color-primary, #2563eb);
  color: white;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

.step-item.active .step-title {
  color: var(--color-primary, #2563eb);
  font-weight: 600;
}

.step-item.pending .step-circle {
  background: var(--color-bg, #f1f5f9);
  color: var(--color-text-placeholder, #94a3b8);
  border: 2px solid var(--color-border, #e2e8f0);
}

.step-item.pending .step-title {
  color: var(--color-text-placeholder, #94a3b8);
}

@media (prefers-reduced-motion: reduce) {
  .step-circle,
  .step-title,
  .step-line {
    transition: none;
  }
}
</style>
