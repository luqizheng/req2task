<script setup lang="ts">

import { useRouter, useRoute } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRawRequirementCreateStore } from "./store";
import WizardContainer from "./WizardContainer.vue";
import RawRequirementInputStep from "./RawRequirementInputStep.vue";
import RequirementResultStep from "./RequirementResultStep.vue";
import { CollectionType } from "@req2task/dto";
import { useRequirementSubmit } from "./useRequirementSubmit";
import { storeToRefs } from "pinia";

const router = useRouter();
const route = useRoute();

const projectId = route.params.id as string;

const store = useRawRequirementCreateStore();
store.projectId = projectId;
const rawRequirementSubmitHelper = useRequirementSubmit(store);
const {rawRequirement} = storeToRefs(store);
const handleBack = () => {
  router.back();
};

const collectionTypeOptions = [
  { label: "会议", value: CollectionType.MEETING },
  { label: "访谈", value: CollectionType.INTERVIEW },
  { label: "文档", value: CollectionType.DOCUMENT },
  { label: "其他", value: CollectionType.OTHER },
];
const handleSubmit = async () => {
  rawRequirementSubmitHelper.save();
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

    <el-card class="meta-card" shadow="hover">
      <div class="meta-form">
        <div class="meta-field">
          <label class="form-label" for="source-input"
            >需求来源 <span class="required">*</span></label
          >
          <el-input
            id="source-input"
            v-model="rawRequirement.source"
            placeholder="名字/职位/部门"
            size="default"
            clearable
          />
        </div>
        <div class="meta-field">
          <label class="form-label" for="collection-type-input">采集方式</label>
          <el-select
            id="collection-type-input"
            v-model="rawRequirement.collectionType"
            placeholder="选择采集方式"
            size="default"
            clearable
          >
            <el-option
              v-for="opt in collectionTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="meta-field">
          <label class="form-label" for="collect-time-input">收集时间</label>
          <el-date-picker
            id="collect-time-input"
            v-model="rawRequirement.collectTime"
            type="datetime"
            placeholder="选择收集时间"
            size="default"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            clearable
          />
        </div>
      </div>
      <div v-if="store.rawRequirement.content" class="raw-requirement-display">
        <div class="display-label">原始需求内容</div>
        <div class="display-content">{{ store.rawRequirement.content }}</div>
      </div>
      <el-button @click="handleSubmit">保存</el-button>
    </el-card>

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

.meta-card {
  max-width: 1400px;
  margin: 0 auto var(--spacing-card, 16px);
}

.meta-form {
  display: flex;
  gap: var(--spacing-compact, 8px);
}

.raw-requirement-display {
  margin-top: var(--spacing-component, 12px);
  padding-top: var(--spacing-component, 12px);
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.display-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 8px;
}

.display-content {
  padding: 12px;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e8f0);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary, #1e293b);
  white-space: pre-wrap;
  word-break: break-word;
}

.meta-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 4px;
  display: block;
}

.required {
  color: var(--color-danger, #ef4444);
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

  .meta-form {
    flex-direction: column;
  }
}
</style>
