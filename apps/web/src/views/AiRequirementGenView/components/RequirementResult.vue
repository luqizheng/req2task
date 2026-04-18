<script setup lang="ts">
import { Refresh, Edit, Check, Close } from '@element-plus/icons-vue';
import type { EditableRequirement } from '../composables';
import UserStoryList from './UserStoryList.vue';
import AcceptanceCriteriaList from './AcceptanceCriteriaList.vue';

const props = defineProps<{
  editableRequirement: EditableRequirement;
  isEditing: boolean;
  isLoading: boolean;
  isRegeneratingUserStory: boolean;
  isRegeneratingCriteria: boolean;
}>();

const emit = defineEmits<{
  'edit': [];
  'cancel': [];
  'save': [];
  'regenerate': [];
  'add-user-story': [];
  'remove-user-story': [index: number];
  'update-user-story-role': [index: number, value: string];
  'update-user-story-goal': [index: number, value: string];
  'update-user-story-benefit': [index: number, value: string];
  'regenerate-user-stories': [];
  'add-criteria': [];
  'remove-criteria': [index: number];
  'update-criteria': [index: number, value: string];
  'regenerate-criteria': [];
  'update-title': [value: string];
  'update-description': [value: string];
  'update-priority': [value: string];
}>();

const priorityType = (priority: string) => {
  if (priority === 'high') return 'danger';
  if (priority === 'medium') return 'warning';
  return 'info';
};

const priorityLabel = (priority: string) => {
  if (priority === 'high') return '高';
  if (priority === 'medium') return '中';
  return '低';
};
</script>

<template>
  <el-card class="requirement-result-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">生成结果</span>
        <div class="header-actions">
          <template v-if="!isEditing">
            <el-button
              type="primary"
              :icon="Edit"
              size="small"
              @click="emit('edit')"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              :icon="Refresh"
              size="small"
              @click="emit('regenerate')"
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
              @click="emit('save')"
            >
              保存
            </el-button>
            <el-button :icon="Close" size="small" @click="emit('cancel')">
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
              :model-value="props.editableRequirement.title"
              @input="emit('update-title', ($event.target as HTMLInputElement).value)"
            />
            <span v-else>{{ props.editableRequirement.title }}</span>
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-if="isEditing"
              :model-value="props.editableRequirement.description"
              type="textarea"
              :rows="4"
              @input="emit('update-description', ($event.target as HTMLTextAreaElement).value)"
            />
            <span v-else>{{ props.editableRequirement.description }}</span>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select
              v-if="isEditing"
              :model-value="props.editableRequirement.priority"
              style="width: 100%"
              @change="emit('update-priority', $event)"
            >
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
            <el-tag
              v-else
              :type="priorityType(props.editableRequirement.priority) as any"
            >
              {{ priorityLabel(props.editableRequirement.priority) }}
            </el-tag>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <UserStoryList
        :user-stories="props.editableRequirement.userStories"
        :is-editing="isEditing"
        :is-regenerating="isRegeneratingUserStory"
        @add="emit('add-user-story')"
        @remove="emit('remove-user-story', $event)"
        @update:role="emit('update-user-story-role', $event, arguments[1])"
        @update:goal="emit('update-user-story-goal', $event, arguments[1])"
        @update:benefit="emit('update-user-story-benefit', $event, arguments[1])"
        @regenerate="emit('regenerate-user-stories')"
      />

      <el-divider />

      <AcceptanceCriteriaList
        :criteria="props.editableRequirement.acceptanceCriteria"
        :is-editing="isEditing"
        :is-regenerating="isRegeneratingCriteria"
        @add="emit('add-criteria')"
        @remove="emit('remove-criteria', $event)"
        @update="emit('update-criteria', $event, arguments[1])"
        @regenerate="emit('regenerate-criteria')"
      />
    </div>
  </el-card>
</template>

<style scoped>
.requirement-result-card {
  margin-bottom: 20px;
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

.requirement-content {
  padding: 8px 0;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}
</style>
