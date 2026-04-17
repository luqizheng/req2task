<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, Edit, Delete, MagicStick, Close, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRawRequirementStore } from '@/stores/rawRequirement';
import { useAiStore } from '@/stores/ai';
import type { RawRequirementResponse } from '@/api/ai';
import type { GenerateRequirementResponse } from '@req2task/dto';

const route = useRoute();
const router = useRouter();
const rawRequirementStore = useRawRequirementStore();
const aiStore = useAiStore();

const projectId = computed(() => route.params.projectId as string);
const moduleId = computed(() => route.params.moduleId as string);

const isAdding = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const newRequirementContent = ref('');
const generatingId = ref<string | null>(null);
const generatedResult = ref<GenerateRequirementResponse | null>(null);
const showResultDialog = ref(false);

const requirementFormRules = {
  content: [{ required: true, message: '请输入原始需求内容', trigger: 'blur' }]
};

const handleAddRequirement = () => {
  isAdding.value = true;
  newRequirementContent.value = '';
};

const handleCancelAdd = () => {
  isAdding.value = false;
  newRequirementContent.value = '';
};

const handleSaveRequirement = async () => {
  if (!newRequirementContent.value.trim()) {
    ElMessage.warning('请输入原始需求内容');
    return;
  }
  try {
    await rawRequirementStore.addRequirement(moduleId.value, newRequirementContent.value);
    ElMessage.success('添加成功');
    handleCancelAdd();
  } catch (error) {
    ElMessage.error((error as Error).message || '添加失败');
  }
};

const handleEdit = (requirement: RawRequirementResponse) => {
  editingId.value = requirement.id;
  newRequirementContent.value = requirement.content;
  isEditing.value = true;
};

const handleCancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  newRequirementContent.value = '';
};

const handleSaveEdit = async () => {
  if (!editingId.value || !newRequirementContent.value.trim()) {
    ElMessage.warning('请输入原始需求内容');
    return;
  }
  rawRequirementStore.updateRequirement(editingId.value, newRequirementContent.value);
  ElMessage.success('更新成功');
  handleCancelEdit();
};

const handleDelete = async (requirement: RawRequirementResponse) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除该原始需求吗？`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    rawRequirementStore.deleteRequirement(requirement.id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleGenerate = async (requirement: RawRequirementResponse) => {
  generatingId.value = requirement.id;
  generatedResult.value = null;
  showResultDialog.value = true;
  try {
    const configId = aiStore.getActiveConfigId();
    generatedResult.value = await rawRequirementStore.generateFromRaw(requirement.id, configId);
  } catch (error) {
    ElMessage.error((error as Error).message || '生成失败');
    showResultDialog.value = false;
  } finally {
    generatingId.value = null;
  }
};

const handleRefresh = async () => {
  try {
    await rawRequirementStore.fetchRequirements(moduleId.value);
    ElMessage.success('刷新成功');
  } catch (error) {
    ElMessage.error((error as Error).message || '刷新失败');
  }
};

const handleBack = () => {
  router.push(`/projects/${projectId.value}/modules/${moduleId.value}/requirements`);
};

onMounted(async () => {
  try {
    await rawRequirementStore.fetchRequirements(moduleId.value);
    if (aiStore.configs.length === 0) {
      await aiStore.fetchConfigs();
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '加载失败');
  }
});
</script>

<template>
  <div class="raw-requirement-collect-view">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="Close" text @click="handleBack">返回</el-button>
        <h2 class="page-title">原始需求收集</h2>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="handleRefresh" :loading="rawRequirementStore.isLoading">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleAddRequirement" :disabled="isAdding">
          添加原始需求
        </el-button>
      </div>
    </div>

    <div class="content-area">
      <el-card v-loading="rawRequirementStore.isLoading">
        <template #header>
          <div class="card-header">
            <span class="card-title">原始需求列表</span>
            <span class="card-count">{{ rawRequirementStore.requirements.length }} 条</span>
          </div>
        </template>

        <div v-if="rawRequirementStore.requirements.length === 0 && !isAdding" class="empty-state">
          <el-empty description="暂无原始需求，请点击添加按钮创建">
            <el-button type="primary" @click="handleAddRequirement">添加原始需求</el-button>
          </el-empty>
        </div>

        <div v-else class="requirement-list">
          <div v-if="isAdding" class="add-form">
            <el-input
              v-model="newRequirementContent"
              type="textarea"
              :rows="3"
              placeholder="请输入原始需求内容..."
            />
            <div class="form-actions">
              <el-button type="primary" size="small" @click="handleSaveRequirement">
                保存
              </el-button>
              <el-button size="small" @click="handleCancelAdd">取消</el-button>
            </div>
          </div>

          <div
            v-for="requirement in rawRequirementStore.requirements"
            :key="requirement.id"
            class="requirement-item"
          >
            <div v-if="isEditing && editingId === requirement.id" class="edit-form">
              <el-input
                v-model="newRequirementContent"
                type="textarea"
                :rows="3"
              />
              <div class="form-actions">
                <el-button type="primary" size="small" @click="handleSaveEdit">
                  保存
                </el-button>
                <el-button size="small" @click="handleCancelEdit">取消</el-button>
              </div>
            </div>
            <div v-else class="requirement-content">
              <div class="content-text">{{ requirement.content }}</div>
              <div class="requirement-actions">
                <el-button
                  type="primary"
                  :icon="MagicStick"
                  size="small"
                  :loading="generatingId === requirement.id"
                  @click="handleGenerate(requirement)"
                >
                  AI 转换
                </el-button>
                <el-button
                  type="default"
                  :icon="Edit"
                  size="small"
                  @click="handleEdit(requirement)"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  size="small"
                  @click="handleDelete(requirement)"
                />
              </div>
            </div>
            <div class="requirement-meta">
              <span class="meta-time">创建于 {{ requirement.createdAt }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="showResultDialog"
      title="AI 生成结果"
      width="600px"
    >
      <div v-if="generatingId" class="generating">
        <el-icon class="is-loading" :size="32"><Refresh /></el-icon>
        <span>正在生成，请稍候...</span>
      </div>
      <div v-else-if="generatedResult" class="generated-result">
        <div class="result-section">
          <h4>标题</h4>
          <p>{{ generatedResult.title }}</p>
        </div>
        <div class="result-section">
          <h4>描述</h4>
          <p>{{ generatedResult.description }}</p>
        </div>
        <div class="result-section">
          <h4>优先级</h4>
          <el-tag>{{ generatedResult.priority }}</el-tag>
        </div>
        <div class="result-section">
          <h4>验收条件</h4>
          <ul>
            <li v-for="(criteria, idx) in generatedResult.acceptanceCriteria" :key="idx">
              {{ criteria }}
            </li>
          </ul>
        </div>
        <div class="result-section">
          <h4>用户故事</h4>
          <div
            v-for="(story, idx) in generatedResult.userStories"
            :key="idx"
            class="user-story"
          >
            <p><strong>角色：</strong>{{ story.role }}</p>
            <p><strong>目标：</strong>{{ story.goal }}</p>
            <p><strong>价值：</strong>{{ story.benefit }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.raw-requirement-collect-view {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.content-area {
  min-height: 400px;
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

.card-count {
  font-size: 14px;
  color: #64748b;
}

.empty-state {
  padding: 40px 0;
}

.requirement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-form,
.edit-form {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

.requirement-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.requirement-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.requirement-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.content-text {
  flex: 1;
  color: #1e293b;
  line-height: 1.6;
  white-space: pre-wrap;
}

.requirement-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.requirement-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.meta-time {
  font-size: 12px;
  color: #94a3b8;
}

.generating {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  color: #64748b;
}

.generated-result {
  max-height: 60vh;
  overflow-y: auto;
}

.result-section {
  margin-bottom: 16px;
}

.result-section h4 {
  margin: 0 0 8px;
  color: #475569;
  font-size: 14px;
}

.result-section p {
  margin: 0;
  color: #1e293b;
  line-height: 1.6;
}

.result-section ul {
  margin: 0;
  padding-left: 20px;
  color: #1e293b;
}

.result-section li {
  margin-bottom: 4px;
}

.user-story {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.user-story p {
  margin: 4px 0;
}
</style>
