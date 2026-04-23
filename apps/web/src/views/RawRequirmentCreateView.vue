<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useWizard } from "@/composables/useWizard";
import {
  WizardContainer,
  RawRequirementInputStep,
  QuestionListStep,
  RequirementResultStep,
} from "@/components/wizard";

const router = useRouter();
const route = useRoute();

const projectId = route.params.id as string;

const wizard = useWizard({
  projectId,
  onComplete: (requirement) => {
    console.log("需求生成完成:", requirement);
  },
});

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="raw-requirement-create">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">返回</el-button>
        <h2 class="page-title">录入原始需求</h2>
      </div>
    </div>

    <el-card class="wizard-card">
      <WizardContainer :wizard="wizard" title="需求录入向导">
        <template #step1>
          <RawRequirementInputStep :project-id="projectId" :wizard="wizard" />
        </template>

        <template #step2>
          <QuestionListStep :wizard="wizard" />
        </template>

        <template #step3>
          <RequirementResultStep :wizard="wizard" />
        </template>
      </WizardContainer>
    </el-card>
  </div>
</template>

<style scoped>
.raw-requirement-create {
  padding: 20px;
  min-height: calc(100vh - 100px);
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

.wizard-card {
  max-width: 900px;
  margin: 0 auto;
}

.wizard-card :deep(.el-card__body) {
  padding: 0;
}
</style>
