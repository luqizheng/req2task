<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRawRequirementCreateStore } from "./store";
import WizardContainer from "./WizardContainer.vue";
import RawRequirementInputStep from "./RawRequirementInputStep.vue";
import RequirementResultStep from "./RequirementResultStep.vue";

const router = useRouter();
const route = useRoute();

const projectId = route.params.id as string;

const store = useRawRequirementCreateStore();

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="raw-requirement-create">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
        <h1 class="page-title">录入原始需求</h1>
      </div>
    </div>

    <el-card class="wizard-card" shadow="hover">
      <WizardContainer :store="store" title="需求录入向导">
        <template #step1>
          <RawRequirementInputStep :project-id="projectId" :store="store" />
        </template>

        <template #step2>
          <RequirementResultStep :store="store" />
        </template>
      </WizardContainer>
    </el-card>
  </div>
</template>

<style scoped>
.raw-requirement-create {
  padding: var(--spacing-page, 20px);
  min-height: calc(100dvh - 100px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-card, 16px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-component, 12px);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary, #1e293b);
  margin: 0;
}

.wizard-card {
  max-width: 1400px;
  margin: 0 auto;
}

.wizard-card :deep(.el-card__body) {
  padding: 0;
}

@media (max-width: 768px) {
  .raw-requirement-create {
    padding: var(--spacing-compact, 8px);
  }

  .page-title {
    font-size: 16px;
  }
}
</style>
