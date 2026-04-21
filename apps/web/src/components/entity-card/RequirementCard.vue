<script setup lang="ts">
import { computed } from 'vue';
import { ElTag, ElAvatar, ElProgress, ElButton } from 'element-plus';
import { Edit, FolderOpened } from '@element-plus/icons-vue';

const statusConfig: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
  draft: { label: '草稿', type: 'info' },
  reviewed: { label: '已评审', type: 'info' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' },
  processing: { label: '进行中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
};

const priorityConfig: Record<string, { label: string; type: 'danger' | 'warning' | 'info' | 'success' }> = {
  critical: { label: '紧急', type: 'danger' },
  high: { label: '高', type: 'warning' },
  medium: { label: '中', type: 'info' },
  low: { label: '低', type: 'success' },
};

export interface RequirementCardData {
  id: string;
  title: string;
  priority: string;
  status: string;
  description?: string;
  storyPoints?: number;
  moduleName?: string;
  moduleId?: string | null;
  assignee?: {
    id: string;
    displayName: string;
    username: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
  userStoryCount?: number;
  childCount?: number;
  userStories?: Array<{
    id: string;
    storyPoints: number;
    acceptanceCriteria?: Array<{ id: string }>;
  }>;
  children?: Array<{ id: string; title: string }>;
}

const props = defineProps<{
  data: RequirementCardData;
  clickable?: boolean;
  showProgress?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
  edit: [id: string];
}>();

const statusInfo = computed(() => statusConfig[props.data.status] || { label: props.data.status, type: 'info' as const });
const priorityInfo = computed(() => priorityConfig[props.data.priority] || { label: props.data.priority, type: 'info' as const });

const totalStoryPoints = computed(() => {
  if (props.data.userStories?.length) {
    return props.data.userStories.reduce((sum, us) => sum + us.storyPoints, 0);
  }
  return props.data.storyPoints || 0;
});

const completedStoryPoints = computed(() => {
  if (props.data.userStories?.length) {
    return props.data.userStories.reduce((sum, us) => sum + (us.acceptanceCriteria?.length ? us.storyPoints : 0), 0);
  }
  return 0;
});

const progressPercent = computed(() => {
  if (!totalStoryPoints.value) return 0;
  return Math.round((completedStoryPoints.value / totalStoryPoints.value) * 100);
});

const handleClick = () => {
  if (props.clickable !== false) {
    emit('click', props.data.id);
  }
};

const handleEdit = (e: Event) => {
  e.stopPropagation();
  emit('edit', props.data.id);
};

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div
    class="requirement-card"
    :class="{ clickable: clickable !== false }"
    @click="handleClick"
  >
    <div class="card-header">
      <div class="header-left">
        <el-tag :type="priorityInfo.type" size="small" class="priority-tag">
          {{ priorityInfo.label }}
        </el-tag>
        <el-tag :type="statusInfo.type" size="small" class="status-tag">
          {{ statusInfo.label }}
        </el-tag>
      </div>
      <div class="header-right">
        <slot name="header-actions">
          <el-button
            text
            size="small"
            type="primary"
            :icon="Edit"
            @click="handleEdit"
          />
        </slot>
      </div>
    </div>

    <h3 class="card-title">{{ data.title }}</h3>

    <div v-if="data.description" class="card-description">
      {{ data.description?.substring(0, 100) }}{{ data.description?.length > 100 ? '...' : '' }}
    </div>

    <div class="card-meta">
      <div v-if="data.moduleName" class="meta-item">
        <FolderOpened class="meta-icon" />
        <span>{{ data.moduleName }}</span>
      </div>
      <div v-if="data.assignee" class="meta-item">
        <el-avatar :size="20" class="assignee-avatar">
          {{ data.assignee.displayName?.charAt(0) || data.assignee.username?.charAt(0) }}
        </el-avatar>
        <span>{{ data.assignee.displayName || data.assignee.username }}</span>
      </div>
    </div>

    <div v-if="showProgress && totalStoryPoints > 0" class="card-progress">
      <div class="progress-header">
        <span class="progress-label">故事点进度</span>
        <span class="progress-value">{{ completedStoryPoints }}/{{ totalStoryPoints }}</span>
      </div>
      <el-progress
        :percentage="progressPercent"
        :stroke-width="6"
        :show-text="false"
        :color="progressPercent === 100 ? '#67c23a' : '#409eff'"
      />
    </div>

    <div class="card-footer">
      <div class="footer-left">
        <span v-if="data.childCount" class="stat-badge">
          {{ data.childCount }} 个子需求
        </span>
        <span v-if="data.userStoryCount" class="stat-badge">
          {{ data.userStoryCount }} 个用户故事
        </span>
      </div>
      <div class="footer-right">
        <span v-if="data.storyPoints" class="story-points">
          {{ data.storyPoints }} SP
        </span>
        <span v-if="data.updatedAt" class="time-label">
          {{ formatDate(data.updatedAt) }}
        </span>
      </div>
    </div>

    <slot name="extra" />
  </div>
</template>

<style scoped>
.requirement-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.requirement-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.requirement-card.clickable {
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-right {
  display: flex;
  align-items: center;
}

.priority-tag,
.status-tag {
  border-radius: 4px;
  font-weight: 500;
}

.card-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

.card-description {
  margin: 0 0 12px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.assignee-avatar {
  background: #409eff;
  color: white;
  font-size: 10px;
}

.card-progress {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 12px;
  color: #909399;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-badge {
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
}

.story-points {
  padding: 2px 8px;
  background: #fdf6ec;
  color: #e6a23c;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.time-label {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
