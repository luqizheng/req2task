<script setup lang="ts">
import ViewContainer from "@/components/view-container.vue";
import { useRoute } from "vue-router";
import RustFSUploader from "@/components/common/RustFSUploader.vue";
import { useRawRequirementCreateStore } from "./store";
import QuestionPanel from "./components/QuestionPanel.vue";
import { AppCard } from "@/components/common";
import { CollectionType } from "@req2task/dto";
import { useRequirementSubmit } from "./useRequirementSubmit";
import { storeToRefs } from "pinia";
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { rawRequirementsApi } from "@/api/rawRequirements";
import RequirementList from "./components/RequirementList.vue";

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
// const handleUploadSuccess = (fileDataId: string) => {
//   store.rawRequirement.fileIds = store.rawRequirement.fileIds || [];
//   store.rawRequirement.fileIds.push(fileDataId);
// };

const handleAnalyze = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  //rawRequirementSubmitHelper.analyze();
  rawRequirementSubmitHelper.rawRequirementAnalyze();
};

const questionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.length;
});
const doneQuestionCount = computed(() => {
  return store.rawRequirement.questionAndAnswers.filter((item) => item.answer)
    .length;
});
const handlerGenerateRequirements=async () => {
  rawRequirementSubmitHelper.generateRequirements();
}
</script>

<template>
  <ViewContainer
    v-loading="loading"
    :title="store.rawRequirement.id ? '更新原始需求' : '录入原始需求'"
    contentClass="rq-edit-view-container "
  >
    <template #actions>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>

    <el-card class="meta-card" shadow="hover">
      <el-form
        ref="formRef"
        :model="rawRequirement"
        :rules="formRules"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求来源" prop="source">
              <el-input
                v-model="rawRequirement.source"
                placeholder="名字/职位/部门"
                clearable
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item
              label="采集方式"
              prop="collectionType"
              class="meta-field"
            >
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
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="收集时间"
              prop="collectTime"
              class="meta-field"
            >
              <el-date-picker
                v-model="rawRequirement.collectTime"
                type="datetime"
                placeholder="选择收集时间"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="上传文件" prop="fileIds">
          <RustFSUploader v-model="rawRequirement.fileIds" />
        </el-form-item>
      </el-form>

      <el-form label-position="top">
        <el-form-item label="原始需求内容" prop="content">
          <el-input
            v-model="rawRequirement.content"
            type="textarea"
            placeholder="请输入原始需求内容"
            :rows="4"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
        <el-button type="primary" @click="handleAnalyze">分析</el-button>
      </template>
    </el-card>

    <AppCard
      class="meta-card"
      title="追问与澄清"
      :current-step="doneQuestionCount"
      :total-steps="questionCount"
    >
     <el-button type="primary" @click="handlerGenerateRequirements">生成需求</el-button>
      <template #extra>
        <span class="step-indicator"
          >问题: {{ doneQuestionCount }}/{{ questionCount }}</span
        >
      </template>

      <QuestionPanel :projectId="projectId" :store="store" />
    </AppCard>
    <AppCard
      class="meta-card"
      title="需求列表"
    >
      <RequirementList
        :projectId="projectId"
        :store="store"
      />
    </AppCard>
  </ViewContainer>
</template>
<style>
.rq-edit-view-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  height: calc(100vh - 60px - 40px);
}
</style>
<style scoped>
.step-indicator {
  font-size: 12px;
  font-weight: 500;
  color: #a1a1aa;
}

.raw-requirement-create {
  width: 100%;
}

.meta-card {
  flex: 1;
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
