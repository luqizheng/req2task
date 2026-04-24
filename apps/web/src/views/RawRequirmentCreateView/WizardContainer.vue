<script setup lang="ts">
import { useRawRequirementCreateStore } from "./store";
import WizardStepIndicator from "./WizardStepIndicator.vue";

interface Props {
  store: ReturnType<typeof useRawRequirementCreateStore>;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: "需求录入向导",
});

const stepConfig = [
  { step: 1, title: "录入与澄清", icon: "Edit" },
  { step: 2, title: "生成结果", icon: "DocumentChecked" },
];
</script>

<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <h2 class="wizard-title">{{ title }}</h2>
      <WizardStepIndicator
        :current-step="store.currentStep"
        :steps="stepConfig"
      />
    </div>

    <div class="wizard-content">
      <div v-if="store.currentStep === 1" class="step-content">
        <slot name="step1" />
      </div>

      <div v-else-if="store.currentStep === 2" class="step-content">
        <slot name="step2" />
      </div>
    </div>

    <div class="wizard-footer">
      <el-button
        v-if="store.currentStep > 1"
        @click="store.prevStep"
      >
        上一步
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.wizard-header {
  padding: 24px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5ff 100%);
  border-bottom: 1px solid #e2e8f0;
}

.wizard-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.wizard-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wizard-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
</style>
