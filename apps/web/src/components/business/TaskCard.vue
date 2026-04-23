<script setup lang="ts">
import StatusTag from './StatusTag.vue';
import PriorityTag from './PriorityTag.vue';

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  estimatedHours?: number;
  remainingHours?: number;
  dueDate?: string;
  tags?: string[];
}

const props = defineProps<{
  task: Task;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
  edit: [id: string];
}>();

const handleClick = () => {
  if (props.clickable !== false) {
    emit('click', props.task.id);
  }
};

const handleEdit = (e: Event) => {
  e.stopPropagation();
  emit('edit', props.task.id);
};
</script>

<template>
  <el-card
    class="task-card"
    :class="{ clickable: clickable !== false }"
    shadow="hover"
    @click="handleClick"
  >
    <template #header>
      <div class="card-header">
        <h4 class="title">{{ task.title }}</h4>
        <div class="tags">
          <PriorityTag :priority="task.priority" size="small" />
          <StatusTag :status="task.status" size="small" />
        </div>
      </div>
    </template>

    <div class="card-body">
      <div v-if="task.assignee" class="assignee">
        <el-avatar :size="24" :src="task.assignee.avatar">
          {{ task.assignee.name?.charAt(0) }}
        </el-avatar>
        <span class="assignee-name">{{ task.assignee.name }}</span>
      </div>

      <div v-if="task.estimatedHours" class="meta-item">
        <span class="meta-label">工时：</span>
        <span class="meta-value">
          {{ task.remainingHours ?? task.estimatedHours }} / {{ task.estimatedHours }} h
        </span>
      </div>

      <div v-if="task.dueDate" class="meta-item">
        <span class="meta-label">截止：</span>
        <span class="meta-value" :class="{ overdue: new Date(task.dueDate) < new Date() }">
          {{ task.dueDate }}
        </span>
      </div>

      <div v-if="task.tags?.length" class="tags-list">
        <el-tag v-for="tag in task.tags" :key="tag" size="small" type="info">
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <template #footer>
      <div class="card-footer">
        <el-button type="primary" link size="small" @click="handleEdit">
          编辑
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<style scoped>
.task-card {
  border-radius: 8px;
  transition: all 0.2s;
}

.task-card.clickable {
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  flex: 1;
}

.tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.card-body {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignee {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignee-name {
  font-size: 13px;
  color: #475569;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.meta-label {
  color: #64748b;
}

.meta-value {
  color: #1e293b;
}

.meta-value.overdue {
  color: #ef4444;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
