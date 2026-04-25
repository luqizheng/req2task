<script setup lang="ts">
import { useRawRequirementCreateStore } from "./store";

interface Props {
  store: ReturnType<typeof useRawRequirementCreateStore>;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: "需求录入向导",
});
</script>

<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <h2 class="wizard-title">{{ title }}</h2>
    </div>

    <div class="wizard-content" tabindex="-1" aria-live="polite">
      <div class="step-content" role="tabpanel" aria-label="录入与澄清">
        <slot name="step1" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-card, #fff);
  border-radius: 12px;
  overflow: hidden;
}

.wizard-header {
  padding: var(--spacing-card, 16px);
  background: linear-gradient(135deg, #fafafa 0%, #f5f5ff 100%);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.wizard-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  margin: 0;
}

.wizard-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-card, 16px);
}

.wizard-content:focus {
  outline: none;
}

.step-content {
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-content {
    animation: none;
  }
}
</style>
