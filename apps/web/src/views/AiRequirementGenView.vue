<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Edit, Check, Close } from '@element-plus/icons-vue';
import { aiApi } from '@/api/ai';
import { useAiStore } from '@/stores/ai';
import type { GenerateRequirementResponse, UserStory } from '@/api/ai';

interface GenerationStep {
  key: string;
  label: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

const aiStore = useAiStore();
const isLoading = ref(false);
const rawInput = ref('');
const generatedRequirement = ref<GenerateRequirementResponse | null>(null);
const isEditing = ref(false);
const selectedModuleId = ref<string>('');

const steps = reactive<GenerationStep[]>([
  { key: 'requirement', label: '生成需求', status: 'pending' },
  { key: 'userStory', label: '生成用户故事', status: 'pending' },
  { key: 'criteria', label: '生成验收条件', status: 'pending' },
]);

const editableRequirement = reactive({
  title: '',
  description: '',
  priority: 'medium',
  userStories: [] as UserStory[],
  acceptanceCriteria: [] as string[],
});

const currentStep = computed(() => {
  const completedIndex = steps.findIndex((s) => s.status !== 'completed');
  return completedIndex === -1 ? steps.length : completedIndex;
});

const handleClear = () => {
  rawInput.value = '';
  generatedRequirement.value = null;
  steps.forEach((s) => (s.status = 'pending'));
};

const updateStepStatus = (key: string, status: GenerationStep['status']) => {
  const step = steps.find((s) => s.key === key);
  if (step) {
    step.status = status;
  }
};

const generateAll = async () => {
  if (!rawInput.value.trim()) {
    ElMessage.warning('请输入原始需求描述');
    return;
  }

  isLoading.value = true;
  try {
    updateStepStatus('requirement', 'generating');
    const response = await aiApi.generateRequirement(
      rawInput.value,
      aiStore.getActiveConfigId()
    );
    generatedRequirement.value = response.data.data;
    editableRequirement.title = generatedRequirement.value.title;
    editableRequirement.description = generatedRequirement.value.description;
    editableRequirement.priority = generatedRequirement.value.priority;
    editableRequirement.userStories = [...generatedRequirement.value.userStories];
    editableRequirement.acceptanceCriteria = [
      ...generatedRequirement.value.acceptanceCriteria,
    ];
    updateStepStatus('requirement', 'completed');

    updateStepStatus('userStory', 'completed');
    updateStepStatus('criteria', 'completed');

    ElMessage.success('需求生成完成');
  } catch (error) {
    updateStepStatus('requirement', 'failed');
    ElMessage.error((error as Error).message || '生成失败');
  } finally {
    isLoading.value = false;
  }
};

const regenerateUserStories = async () => {
  if (!editableRequirement.description) {
    ElMessage.warning('请先生成需求');
    return;
  }

  isLoading.value = true;
  try {
    updateStepStatus('userStory', 'generating');
    const content = `${editableRequirement.title}\n${editableRequirement.description}`;
    const response = await aiApi.generateUserStories(
      content,
      aiStore.getActiveConfigId()
    );
    editableRequirement.userStories = response.data.data;
    updateStepStatus('userStory', 'completed');
    ElMessage.success('用户故事重新生成完成');
  } catch (error) {
    updateStepStatus('userStory', 'failed');
    ElMessage.error((error as Error).message || '生成失败');
  } finally {
    isLoading.value = false;
  }
};

const regenerateCriteria = async () => {
  if (!editableRequirement.description) {
    ElMessage.warning('请先生成需求');
    return;
  }

  isLoading.value = true;
  try {
    updateStepStatus('criteria', 'generating');
    const content = `${editableRequirement.title}\n${editableRequirement.description}`;
    const response = await aiApi.generateAcceptanceCriteria(
      content,
      aiStore.getActiveConfigId()
    );
    editableRequirement.acceptanceCriteria = response.data.data;
    updateStepStatus('criteria', 'completed');
    ElMessage.success('验收条件重新生成完成');
  } catch (error) {
    updateStepStatus('criteria', 'failed');
    ElMessage.error((error as Error).message || '生成失败');
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  if (generatedRequirement.value) {
    editableRequirement.title = generatedRequirement.value.title;
    editableRequirement.description = generatedRequirement.value.description;
    editableRequirement.priority = generatedRequirement.value.priority;
    editableRequirement.userStories = [...generatedRequirement.value.userStories];
    editableRequirement.acceptanceCriteria = [
      ...generatedRequirement.value.acceptanceCriteria,
    ];
  }
  isEditing.value = false;
};

const handleSave = () => {
  generatedRequirement.value = {
    id: generatedRequirement.value?.id || '',
    title: editableRequirement.title,
    description: editableRequirement.description,
    priority: editableRequirement.priority,
    userStories: editableRequirement.userStories,
    acceptanceCriteria: editableRequirement.acceptanceCriteria,
  };
  isEditing.value = false;
  ElMessage.success('保存成功');
};

const handleAddUserStory = () => {
  editableRequirement.userStories.push({
    role: '',
    goal: '',
    benefit: '',
  });
};

const handleRemoveUserStory = (index: number) => {
  editableRequirement.userStories.splice(index, 1);
};

const handleAddCriteria = () => {
  editableRequirement.acceptanceCriteria.push('');
};

const handleRemoveCriteria = (index: number) => {
  editableRequirement.acceptanceCriteria.splice(index, 1);
};

const handleSaveToModule = async () => {
  if (!selectedModuleId.value) {
    ElMessage.warning('请选择目标模块');
    return;
  }

  try {
    await aiApi.createRawRequirement(selectedModuleId.value, {
      content: rawInput.value,
    });
    ElMessage.success('已保存到模块');
  } catch (error) {
    ElMessage.error((error as Error).message || '保存失败');
  }
};
</script>

<template>
  <div class="ai-requirement-gen-view">
    <div class="page-header">
      <h2 class="page-title">AI 需求生成</h2>
    </div>

    <el-row :gutter="24">
      <el-col :span="10">
        <el-card class="input-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">原始需求输入</span>
              <el-button size="small" @click="handleClear">清空</el-button>
            </div>
          </template>

          <el-input
            v-model="rawInput"
            type="textarea"
            :rows="12"
            placeholder="请输入原始需求描述..."
            :disabled="isLoading"
          />

          <div class="input-actions">
            <el-button
              type="primary"
              :loading="isLoading"
              @click="generateAll"
              size="large"
            >
              AI 生成
            </el-button>
          </div>
        </el-card>

        <el-card class="progress-card" v-if="currentStep > 0">
          <template #header>
            <span class="card-title">生成进度</span>
          </template>

          <el-steps :active="currentStep" direction="vertical">
            <el-step
              v-for="step in steps"
              :key="step.key"
              :title="step.label"
              :status="step.status"
            />
          </el-steps>
        </el-card>

        <el-card class="module-card">
          <template #header>
            <span class="card-title">保存到模块</span>
          </template>

          <el-select
            v-model="selectedModuleId"
            placeholder="选择目标模块"
            style="width: 100%; margin-bottom: 12px"
          >
            <el-option label="模块1" value="module1" />
            <el-option label="模块2" value="module2" />
          </el-select>

          <el-button
            type="success"
            :icon="Check"
            @click="handleSaveToModule"
            :disabled="!selectedModuleId || !rawInput"
          >
            保存原始需求
          </el-button>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card v-if="!generatedRequirement" class="empty-result">
          <el-empty description="请先输入原始需求并点击生成">
            <template #image>
              <div style="font-size: 48px; color: #c0c4cc">📝</div>
            </template>
          </el-empty>
        </el-card>

        <el-card v-else class="result-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">生成结果</span>
              <div class="header-actions">
                <template v-if="!isEditing">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    size="small"
                    @click="handleEdit"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="primary"
                    :icon="Refresh"
                    size="small"
                    @click="generateAll"
                    :loading="isLoading"
                  >
                    重新生成
                  </el-button>
                </template>
                <template v-else>
                  <el-button
                    type="success"
                    :icon="Check"
                    size="small"
                    @click="handleSave"
                  >
                    保存
                  </el-button>
                  <el-button :icon="Close" size="small" @click="handleCancelEdit">
                    取消
                  </el-button>
                </template>
              </div>
            </div>
          </template>

          <div class="requirement-content">
            <div class="section">
              <h4 class="section-title">需求信息</h4>
              <el-form label-width="80px">
                <el-form-item label="标题">
                  <el-input
                    v-if="isEditing"
                    v-model="editableRequirement.title"
                  />
                  <span v-else>{{ editableRequirement.title }}</span>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input
                    v-if="isEditing"
                    v-model="editableRequirement.description"
                    type="textarea"
                    :rows="4"
                  />
                  <span v-else>{{ editableRequirement.description }}</span>
                </el-form-item>
                <el-form-item label="优先级">
                  <el-select
                    v-if="isEditing"
                    v-model="editableRequirement.priority"
                    style="width: 100%"
                  >
                    <el-option label="高" value="high" />
                    <el-option label="中" value="medium" />
                    <el-option label="低" value="low" />
                  </el-select>
                  <el-tag v-else :type="editableRequirement.priority === 'high' ? 'danger' : editableRequirement.priority === 'medium' ? 'warning' : 'info'">
                    {{ editableRequirement.priority === 'high' ? '高' : editableRequirement.priority === 'medium' ? '中' : '低' }}
                  </el-tag>
                </el-form-item>
              </el-form>
            </div>

            <el-divider />

            <div class="section">
              <div class="section-header">
                <h4 class="section-title">用户故事</h4>
                <el-button
                  v-if="isEditing"
                  size="small"
                  type="primary"
                  @click="handleAddUserStory"
                >
                  添加
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="warning"
                  :icon="Refresh"
                  @click="regenerateUserStories"
                  :loading="isLoading && steps[1].status === 'generating'"
                >
                  重新生成
                </el-button>
              </div>

              <div
                v-for="(story, index) in editableRequirement.userStories"
                :key="index"
                class="user-story-item"
              >
                <el-card shadow="hover">
                  <template #header>
                    <span>用户故事 {{ index + 1 }}</span>
                    <el-button
                      v-if="isEditing"
                      type="danger"
                      size="small"
                      text
                      @click="handleRemoveUserStory(index)"
                    >
                      删除
                    </el-button>
                  </template>
                  <el-form label-width="60px" size="small">
                    <el-form-item label="角色">
                      <el-input
                        v-if="isEditing"
                        v-model="story.role"
                        placeholder="作为..."
                      />
                      <span v-else>{{ story.role }}</span>
                    </el-form-item>
                    <el-form-item label="目标">
                      <el-input
                        v-if="isEditing"
                        v-model="story.goal"
                        placeholder="我想要..."
                      />
                      <span v-else>{{ story.goal }}</span>
                    </el-form-item>
                    <el-form-item label="收益">
                      <el-input
                        v-if="isEditing"
                        v-model="story.benefit"
                        placeholder="以便..."
                      />
                      <span v-else>{{ story.benefit }}</span>
                    </el-form-item>
                  </el-form>
                </el-card>
              </div>

              <el-empty
                v-if="editableRequirement.userStories.length === 0"
                description="暂无用户故事"
                :image-size="60"
              />
            </div>

            <el-divider />

            <div class="section">
              <div class="section-header">
                <h4 class="section-title">验收条件</h4>
                <el-button
                  v-if="isEditing"
                  size="small"
                  type="primary"
                  @click="handleAddCriteria"
                >
                  添加
                </el-button>
                <el-button
                  v-else
                  size="small"
                  type="warning"
                  :icon="Refresh"
                  @click="regenerateCriteria"
                  :loading="isLoading && steps[2].status === 'generating'"
                >
                  重新生成
                </el-button>
              </div>

              <el-checkbox-group v-if="isEditing">
                <div
                  v-for="(_criteria, index) in editableRequirement.acceptanceCriteria"
                  :key="index"
                  class="criteria-item"
                >
                  <el-input
                    v-model="editableRequirement.acceptanceCriteria[index]"
                    placeholder="验收条件..."
                  />
                  <el-button
                    type="danger"
                    text
                    @click="handleRemoveCriteria(index)"
                  >
                    删除
                  </el-button>
                </div>
              </el-checkbox-group>

              <el-space
                v-else
                direction="vertical"
                style="width: 100%"
              >
                <el-check-tag
                  v-for="(criteria, index) in editableRequirement.acceptanceCriteria"
                  :key="index"
                  type="success"
                  style="width: 100%; text-align: left"
                >
                  {{ criteria }}
                </el-check-tag>
              </el-space>

              <el-empty
                v-if="editableRequirement.acceptanceCriteria.length === 0"
                description="暂无验收条件"
                :image-size="60"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.ai-requirement-gen-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.input-card,
.progress-card,
.module-card {
  margin-bottom: 20px;
}

.input-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.empty-result {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.requirement-content {
  padding: 8px 0;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.user-story-item {
  margin-bottom: 12px;
}

.criteria-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.criteria-item .el-input {
  flex: 1;
}
</style>
