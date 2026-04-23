<script setup lang="ts">
import { computed } from 'vue';
import { ElTag, ElAvatar, ElButton, ElProgress } from 'element-plus';
import { Edit, Clock, User, WarningFilled } from '@element-plus/icons-vue';

const statusConfig: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = {
  todo: { label: '待处理', type: 'info' },
  in_progress: { label: '进行中', type: 'info' },
  in_review: { label: '待评审', type: 'warning' },
  done: { label: '已完成', type: 'success' },
  blocked: { label: '已阻塞', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
};

const priorityConfig: Record<string, { label: string; type: 'danger' | 'warning' | 'info' | 'success' }> = {
  urgent: { label: '紧急', type: 'danger' },
  high: { label: '高', type: 'warning' },
  medium: { label: '中', type: 'info' },
  low: { label: '低', type: 'success' },
};

export interface TaskCardData {
  id: string;
  taskNo?: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: {
    id: string;
    displayName: string;
    username: string;
  };
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  tags?: string[];
  parentTaskId?: string | null;
}

const props = defineProps<{
  data: TaskCardData;
  clickable?: boolean;
  showProgress?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
  edit: [id: string];
}>();

const statusInfo = computed(() => statusConfig[props.data.status] || { label: props.data.status, type: 'info' as const });
const priorityInfo = computed(() => priorityConfig[props.data.priority] || { label: props.data.priority, type: 'info' as const });

const progressPercent = computed(() => {
  if (!props.data.estimatedHours) return 0;
  const actual = props.data.actualHours || 0;
  return Math.min(100, Math.round((actual / props.data.estimatedHours) * 100));
});

const isOverdue = computed(() => {
  if (!props.data.dueDate) return false;
  return new Date(props.data.dueDate) < new Date() && props.data.status !== 'done' && props.data.status !== 'cancelled';
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

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const remainingHours = computed(() => {
  if (!props.data.estimatedHours) return null;
  const remaining = props.data.estimatedHours - (props.data.actualHours || 0);
  return remaining > 0 ? remaining : 0;
});
</script>

<template>
  <div
    class="task-card"
    :class="{ clickable: clickable !== false, overdue: isOverdue }"
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
        <span v-if="data.taskNo" class="task-no">{{ data.taskNo }}</span>
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

    <h4 class="card-title">{{ data.title }}</h4>

    <div class="card-body">
      <div class="body-row">
        <div v-if="data.assignedTo" class="assignee-section">
          <el-avatar :size="22" class="assignee-avatar">
            {{ data.assignedTo.displayName?.charAt(0) || data.assignedTo.username?.charAt(0) }}
          </el-avatar>
          <span class="assignee-name">{{ data.assignedTo.displayName || data.assignedTo.username }}</span>
        </div>
        <div v-else class="unassigned">
          <el-avatar :size="22" class="unassigned-avatar">
            <User />
          </el-avatar>
          <span class="unassigned-text">未分配</span>
        </div>
      </div>

      <div v-if="showProgress && data.estimatedHours" class="progress-section">
        <div class="progress-header">
          <span class="progress-label">
            <Clock class="progress-icon" />
            工时进度
          </span>
          <span class="progress-value">
            {{ data.actualHours || 0 }} / {{ data.estimatedHours }} h
          </span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="4"
          :show-text="false"
          :color="progressPercent >= 100 ? '#67c23a' : progressPercent > 80 ? '#e6a23c' : '#409eff'"
        />
        <span v-if="remainingHours !== null && remainingHours > 0" class="remaining-label">
          剩余 {{ remainingHours }}h
        </span>
      </div>

      <div v-if="data.tags?.length" class="tags-row">
        <el-tag
          v-for="(tag, index) in data.tags.slice(0, 3)"
          :key="index"
          size="small"
          type="info"
          class="tag-item"
        >
          {{ tag }}
        </el-tag>
        <el-tag v-if="data.tags.length > 3" size="small" type="info" class="tag-item">
          +{{ data.tags.length - 3 }}
        </el-tag>
      </div>
    </div>

    <div v-if="data.dueDate" class="card-footer">
      <div class="due-date" :class="{ overdue: isOverdue }">
        <WarningFilled v-if="isOverdue" class="overdue-icon" />
        <Clock v-else class="due-icon" />
        <span>{{ formatDate(data.dueDate) }}</span>
        <span v-if="isOverdue" class="overdue-text">已逾期</span>
      </div>
      <span v-if="data.updatedAt" class="time-label">
        更新于 {{ formatDate(data.updatedAt) }}
      </span>
    </div>

    <slot name="extra" />
  </div>
</template>

<style scoped>
.task-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 14px;
  transition: all 0.2s ease;
}

.task-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.task-card.clickable {
  cursor: pointer;
}

.task-card.overdue {
  border-left: 3px solid #f56c6c;
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

.task-no {
  font-size: 11px;
  font-weight: 600;
  color: #909399;
  font-family: 'JetBrains Mono', monospace;
}

.card-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.body-row {
  display: flex;
  align-items: center;
}

.assignee-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-avatar {
  background: #409eff;
  color: white;
  font-size: 10px;
}

.assignee-name {
  font-size: 13px;
  color: #303133;
}

.unassigned {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unassigned-avatar {
  background: #f4f4f5;
  color: #c0c4cc;
}

.unassigned-text {
  font-size: 13px;
  color: #c0c4cc;
}

.progress-section {
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.progress-icon {
  width: 12px;
  height: 12px;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.remaining-label {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #909399;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  border-radius: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.due-date.overdue {
  color: #f56c6c;
}

.due-icon,
.overdue-icon {
  width: 12px;
  height: 12px;
}

.overdue-text {
  font-weight: 500;
}

.time-label {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
