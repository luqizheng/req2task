<script setup lang="ts">
import ViewContainer from "@/components/view-container.vue";
import { useRouter, useRoute } from "vue-router";

import { useRawRequirementCreateStore } from "./store";

import RawRequirementInputStep from "./RawRequirementInputStep.vue";
import { CollectionType } from "@req2task/dto";
import { useRequirementSubmit } from "./useRequirementSubmit";
import { storeToRefs } from "pinia";
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { rawRequirementsApi } from "@/api/rawRequirements";


const router = useRouter();
const route = useRoute();

const projectId = route.params.id as string;
const rawRequirementId = route.params.rawRequirementId as string | undefined;

const store = useRawRequirementCreateStore();
store.projectId = projectId;
const rawRequirementSubmitHelper = useRequirementSubmit(store);
const { rawRequirement } = storeToRefs(store);
const loading = ref(false);

const formRef = ref<FormInstance>();

const formRules = reactive<FormRules>({
  source: [{ required: true, message: "请输入需求来源", trigger: "blur" }],
  content: [{ required: true, message: "请输入原始需求内容", trigger: "blur" }],
  collectionType: [
    { required: true, message: "请选择采集方式", trigger: "change" },
  ],
  collectTime: [
    { required: true, message: "请选择收集时间", trigger: "change" },
  ],
});



const collectionTypeOptions = [
  { label: "会议", value: CollectionType.MEETING },
  { label: "访谈", value: CollectionType.INTERVIEW },
  { label: "文档", value: CollectionType.DOCUMENT },
  { label: "其他", value: CollectionType.OTHER },
];

onMounted(async () => {
  if (rawRequirementId) {
    loading.value = true;
    try {
      const data = await rawRequirementsApi.getRawRequirement(rawRequirementId);
      store.loadRawRequirement(data);
    } catch (error) {
      console.error("加载原始需求失败:", error);
    } finally {
      loading.value = false;
    }
  }
});

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  rawRequirementSubmitHelper.save();
};
</script>

<template>
  <ViewContainer 
    v-loading="loading"
    :title="store.rawRequirement.id ? '更新原始需求' : '录入原始需求'"
  >

    <el-card class="meta-card" shadow="hover" style="margin-bottom: 20px;">
      <el-form
        ref="formRef"
        :model="rawRequirement"
        :rules="formRules"
        label-position="top"
        class="meta-form"
      >
        <el-form-item label="需求来源" prop="source" class="meta-field">
          <el-input
            v-model="rawRequirement.source"
            placeholder="名字/职位/部门"
            clearable
          />
        </el-form-item>
        <el-form-item label="采集方式" prop="collectionType" class="meta-field">
          <el-select
            v-model="rawRequirement.collectionType"
            placeholder="选择采集方式"
            clearable
          >
            <el-option
              v-for="opt in collectionTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收集时间" prop="collectTime" class="meta-field">
          <el-date-picker
            v-model="rawRequirement.collectTime"
            type="datetime"
            placeholder="选择收集时间"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="meta-card" shadow="hover">
      <RawRequirementInputStep :project-id="projectId" :store="store" />
    </el-card>
  </ViewContainer>
</template>

<style scoped>
.raw-requirement-create {
  width: 100%;
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

.meta-form {
  display: flex;
  gap: var(--spacing-compact, 8px);
}

.meta-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.meta-field {
  flex: 1;
}

.wizard-card {
  margin: 20px auto;
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
