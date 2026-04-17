<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, Edit, Delete, Close, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStoryStore } from '@/stores/userStory';
import { useAcceptanceCriteriaStore } from '@/stores/acceptanceCriteria';
import type { UserStoryResponseDto } from '@req2task/dto';
import type { AcceptanceCriteriaResponseDto } from '@req2task/dto';

const route = useRoute();
const router = useRouter();
const userStoryStore = useUserStoryStore();
const criteriaStore = useAcceptanceCriteriaStore();

const requirementId = computed(() => route.params.requirementId as string);

const selectedStory = ref<UserStoryResponseDto | null>(null);
const isAddingStory = ref(false);
const isEditingStory = ref(false);
const editingStoryId = ref<string | null>(null);
const isAddingCriteria = ref(false);
const isEditingCriteria = ref(false);
const editingCriteriaId = ref<string | null>(null);

const storyForm = ref({
  role: '',
  goal: '',
  benefit: ''
});

const criteriaForm = ref({
  content: '',
  type: 'functional'
});

const handleSelectStory = async (story: UserStoryResponseDto) => {
  selectedStory.value = story;
  try {
    await criteriaStore.fetchByUserStory(story.id);
  } catch (error) {
    ElMessage.error((error as Error).message || '加载验收条件失败');
  }
};

const handleAddStory = () => {
  storyForm.value = { role: '', goal: '', benefit: '' };
  isAddingStory.value = true;
};

const handleCancelAddStory = () => {
  isAddingStory.value = false;
  storyForm.value = { role: '', goal: '', benefit: '' };
};

const handleSaveStory = async () => {
  if (!storyForm.value.role || !storyForm.value.goal || !storyForm.value.benefit) {
    ElMessage.warning('请填写完整的用户故事信息');
    return;
  }
  try {
    await userStoryStore.create(requirementId.value, storyForm.value);
    ElMessage.success('创建成功');
    handleCancelAddStory();
  } catch (error) {
    ElMessage.error((error as Error).message || '创建失败');
  }
};

const handleEditStory = (story: UserStoryResponseDto) => {
  storyForm.value = {
    role: story.role,
    goal: story.goal,
    benefit: story.benefit
  };
  editingStoryId.value = story.id;
  isEditingStory.value = true;
};

const handleCancelEditStory = () => {
  isEditingStory.value = false;
  editingStoryId.value = null;
  storyForm.value = { role: '', goal: '', benefit: '' };
};

const handleSaveEditStory = async () => {
  if (!editingStoryId.value) return;
  try {
    await userStoryStore.update(editingStoryId.value, storyForm.value);
    ElMessage.success('更新成功');
    handleCancelEditStory();
  } catch (error) {
    ElMessage.error((error as Error).message || '更新失败');
  }
};

const handleDeleteStory = async (story: UserStoryResponseDto) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户故事吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await userStoryStore.remove(story.id);
    ElMessage.success('删除成功');
    if (selectedStory.value?.id === story.id) {
      selectedStory.value = null;
      criteriaStore.criteriaList = [];
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleAddCriteria = () => {
  criteriaForm.value = { content: '', type: 'functional' };
  isAddingCriteria.value = true;
};

const handleCancelAddCriteria = () => {
  isAddingCriteria.value = false;
  criteriaForm.value = { content: '', type: 'functional' };
};

const handleSaveCriteria = async () => {
  if (!selectedStory.value || !criteriaForm.value.content) {
    ElMessage.warning('请输入验收条件内容');
    return;
  }
  try {
    await criteriaStore.create(selectedStory.value.id, criteriaForm.value);
    ElMessage.success('创建成功');
    handleCancelAddCriteria();
  } catch (error) {
    ElMessage.error((error as Error).message || '创建失败');
  }
};

const handleEditCriteria = (criteria: AcceptanceCriteriaResponseDto) => {
  criteriaForm.value = {
    content: criteria.content,
    type: criteria.type
  };
  editingCriteriaId.value = criteria.id;
  isEditingCriteria.value = true;
};

const handleCancelEditCriteria = () => {
  isEditingCriteria.value = false;
  editingCriteriaId.value = null;
  criteriaForm.value = { content: '', type: 'functional' };
};

const handleSaveEditCriteria = async () => {
  if (!editingCriteriaId.value) return;
  try {
    await criteriaStore.update(editingCriteriaId.value, criteriaForm.value);
    ElMessage.success('更新成功');
    handleCancelEditCriteria();
  } catch (error) {
    ElMessage.error((error as Error).message || '更新失败');
  }
};

const handleDeleteCriteria = async (criteria: AcceptanceCriteriaResponseDto) => {
  try {
    await ElMessageBox.confirm('确定要删除该验收条件吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await criteriaStore.remove(criteria.id);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleBack = () => {
  router.push(`/requirements/${requirementId.value}`);
};

onMounted(async () => {
  try {
    await userStoryStore.fetchByRequirement(requirementId.value);
  } catch (error) {
    ElMessage.error((error as Error).message || '加载失败');
  }
});
</script>

<template>
  <div class="user-story-manage-view">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="Close" text @click="handleBack">返回</el-button>
        <h2 class="page-title">用户故事管理</h2>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAddStory" :disabled="isAddingStory">
        新建用户故事
      </el-button>
    </div>

    <div class="content-layout">
      <el-card class="story-list-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">用户故事列表</span>
            <span class="card-count">{{ userStoryStore.userStories.length }} 个</span>
          </div>
        </template>

        <div v-if="userStoryStore.userStories.length === 0 && !isAddingStory" class="empty-state">
          <el-empty description="暂无用户故事，点击上方按钮创建">
            <el-button type="primary" @click="handleAddStory">创建用户故事</el-button>
          </el-empty>
        </div>

        <div v-else class="story-list">
          <div v-if="isAddingStory" class="story-form-card">
            <h4>新建用户故事</h4>
            <el-form label-width="80" @submit.prevent="handleSaveStory">
              <el-form-item label="角色">
                <el-input v-model="storyForm.role" placeholder="如：系统管理员" />
              </el-form-item>
              <el-form-item label="目标">
                <el-input v-model="storyForm.goal" type="textarea" :rows="2" placeholder="我希望..." />
              </el-form-item>
              <el-form-item label="价值">
                <el-input v-model="storyForm.benefit" type="textarea" :rows="2" placeholder="以便..." />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Check" @click="handleSaveStory">保存</el-button>
                <el-button @click="handleCancelAddStory">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div
            v-for="story in userStoryStore.userStories"
            :key="story.id"
            class="story-item"
            :class="{ active: selectedStory?.id === story.id }"
            @click="handleSelectStory(story)"
          >
            <div v-if="isEditingStory && editingStoryId === story.id" class="story-form-card" @click.stop>
              <h4>编辑用户故事</h4>
              <el-form label-width="80" @submit.prevent="handleSaveEditStory">
                <el-form-item label="角色">
                  <el-input v-model="storyForm.role" />
                </el-form-item>
                <el-form-item label="目标">
                  <el-input v-model="storyForm.goal" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="价值">
                  <el-input v-model="storyForm.benefit" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :icon="Check" size="small" @click="handleSaveEditStory">保存</el-button>
                  <el-button size="small" @click="handleCancelEditStory">取消</el-button>
                </el-form-item>
              </el-form>
            </div>
            <template v-else>
              <div class="story-header">
                <el-tag type="info" size="small">用户故事</el-tag>
                <div class="story-actions" @click.stop>
                  <el-button type="primary" :icon="Edit" size="small" text @click="handleEditStory(story)" />
                  <el-button type="danger" :icon="Delete" size="small" text @click="handleDeleteStory(story)" />
                </div>
              </div>
              <div class="story-body">
                <p class="story-item-text"><strong>角色：</strong>{{ story.role }}</p>
                <p class="story-item-text"><strong>目标：</strong>{{ story.goal }}</p>
                <p class="story-item-text"><strong>价值：</strong>{{ story.benefit }}</p>
              </div>
            </template>
          </div>
        </div>
      </el-card>

      <el-card class="criteria-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">验收条件</span>
            <el-button
              v-if="selectedStory"
              type="primary"
              :icon="Plus"
              size="small"
              @click="handleAddCriteria"
              :disabled="isAddingCriteria"
            >
              添加
            </el-button>
          </div>
        </template>

        <div v-if="!selectedStory" class="empty-state">
          <el-empty description="请先选择一个用户故事" />
        </div>

        <div v-else>
          <div v-if="isAddingCriteria" class="criteria-form">
            <el-input v-model="criteriaForm.content" type="textarea" :rows="2" placeholder="输入验收条件..." />
            <div class="form-actions">
              <el-button type="primary" size="small" @click="handleSaveCriteria">保存</el-button>
              <el-button size="small" @click="handleCancelAddCriteria">取消</el-button>
            </div>
          </div>

          <div v-if="criteriaStore.criteriaList.length === 0 && !isAddingCriteria" class="empty-state">
            <el-empty description="暂无验收条件，点击添加按钮创建" />
          </div>

          <div v-else class="criteria-list">
            <div
              v-for="criteria in criteriaStore.criteriaList"
              :key="criteria.id"
              class="criteria-item"
            >
              <div v-if="isEditingCriteria && editingCriteriaId === criteria.id" class="criteria-form">
                <el-input v-model="criteriaForm.content" type="textarea" :rows="2" />
                <div class="form-actions">
                  <el-button type="primary" size="small" @click="handleSaveEditCriteria">保存</el-button>
                  <el-button size="small" @click="handleCancelEditCriteria">取消</el-button>
                </div>
              </div>
              <template v-else>
                <div class="criteria-content">
                  <el-checkbox :model-value="criteria.isChecked" disabled>{{ criteria.content }}</el-checkbox>
                </div>
                <div class="criteria-actions">
                  <el-button type="primary" :icon="Edit" size="small" text @click="handleEditCriteria(criteria)" />
                  <el-button type="danger" :icon="Delete" size="small" text @click="handleDeleteCriteria(criteria)" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.user-story-manage-view {
  padding: 24px;
  max-width: 1200px;
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

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
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

.story-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.story-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.story-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.story-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.story-actions {
  display: flex;
  gap: 4px;
}

.story-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.story-item-text {
  margin: 0;
  color: #475569;
  font-size: 14px;
}

.story-form-card {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.story-form-card h4 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 14px;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.criteria-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
}

.criteria-content {
  flex: 1;
}

.criteria-actions {
  display: flex;
  gap: 4px;
}

.criteria-form {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}
</style>
