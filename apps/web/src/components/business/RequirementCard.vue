<script setup lang="ts">
import PriorityTag from './PriorityTag.vue';
import StatusTag from './StatusTag.vue';

export interface Requirement {
  id: string;
  title: string;
  priority: string;
  status: string;
  estimatedManDays?: number;
  moduleName?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
}

const props = defineProps<{
  requirement: Requirement;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
  edit: [id: string];
}>();

const handleClick = () => {
  if (props.clickable !== false) {
    emit('click', props.requirement.id);
  }
};

const handleEdit = (e: Event) => {
  e.stopPropagation();
  emit('edit', props.requirement.id);
};
</script>

<template>
  <el-card
    class="requirement-card"
    :class="{ clickable: clickable !== false }"
    shadow="hover"
    @click="handleClick"
  >
    <template #header>
      <div class="card-header">
        <h4 class="title">{{ requirement.title }}</h4>
        <div class="tags">
          <PriorityTag :priority="requirement.priority" />
          <StatusTag :status="requirement.status" />
        </div>
      </div>
    </template>

    <div class="card-body">
      <div v-if="requirement.moduleName" class="meta-item">
        <span class="meta-label">模块：</span>
        <span class="meta-value">{{ requirement.moduleName }}</span>
      </div>
      <div v-if="requirement.estimatedManDays" class="meta-item">
        <span class="meta-label">预估：</span>
        <span class="meta-value">{{ requirement.estimatedManDays }} 人天</span>
      </div>
      <div v-if="requirement.assignee" class="meta-item">
        <span class="meta-label">负责人：</span>
        <span class="meta-value">{{ requirement.assignee.name }}</span>
      </div>
    </div>

    <template #footer>
      <div class="card-footer">
        <span v-if="requirement.createdAt" class="footer-time">
          {{ requirement.createdAt }}
        </span>
        <el-button type="primary" link size="small" @click="handleEdit">
          编辑
        </el-button>
      </div>
    </template>
  </el-card>
</template>

<style scoped>
.requirement-card {
  border-radius: 8px;
  transition: all 0.2s;
}

.requirement-card.clickable {
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
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
}

.tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.card-body {
  padding: 12px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  color: #64748b;
}

.meta-value {
  color: #1e293b;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-time {
  font-size: 12px;
  color: #94a3b8;
}
</style>
