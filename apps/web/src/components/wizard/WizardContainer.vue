<script setup lang="ts">
import type { UseWizardReturn } from "@/composables/useWizard";
import WizardStepIndicator from "./WizardStepIndicator.vue";

interface Props {
  wizard: UseWizardReturn;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: "需求录入向导",
});

const stepConfig = [
  { step: 1, title: "录入需求", icon: "Edit" },
  { step: 2, title: "问题澄清", icon: "ChatDotRound" },
  { step: 3, title: "生成结果", icon: "DocumentChecked" },
];
</script>

<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <h2 class="wizard-title">{{ title }}</h2>
      <WizardStepIndicator
        :current-step="wizard.currentStep.value"
        :steps="stepConfig"
      />
    </div>

    <div class="wizard-content">
      <div v-if="wizard.currentStep.value === 1" class="step-content">
        <slot name="step1" />
      </div>

      <div v-else-if="wizard.currentStep.value === 2" class="step-content">
        <slot name="step2" />
      </div>

      <div v-else-if="wizard.currentStep.value === 3" class="step-content">
        <slot name="step3" />
      </div>
    </div>

    <div class="wizard-footer">
      <el-button
        v-if="wizard.currentStep.value > 1"
        @click="wizard.prevStep"
      >
        上一步
      </el-button>
      <el-button
        v-if="wizard.currentStep.value < 3"
        type="primary"
        :disabled="!wizard.hasQuestions.value"
        @click="wizard.nextStep"
      >
        下一步
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
