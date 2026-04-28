<template>
  <div class="requirement-card">
    <div class="card-header">
      <div class="header-left">
        <span class="card-index">{{ props.index }}</span>
        <h3 class="card-title">{{ props.equipment.title }}</h3>
      </div>
      <el-tag :type="priorityType" size="small">
        {{ props.equipment.priority }}
      </el-tag>
    </div>

    <p class="card-description">
      {{ props.equipment.description }}
    </p>

    <div class="card-tags">
      <el-tag
        v-for="tag in tags"
        :key="tag"
        size="small"
        type="info"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { ElTag } from 'element-plus';
import { Priority, RequirementSource, RequirementStatus } from '@req2task/dto';

interface Props {
  equipment: {
    id: string;
    status: RequirementStatus;
    source: RequirementSource;
    description: string;
    title: string;
    priority: Priority;
  };
  index: number;
  tags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => ['导入', '数据管理', '文件处理'],
});

const priorityType = computed(() => {
  const typeMap: Record<Priority, 'danger' | 'warning' | 'info' | 'success'> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };
  return typeMap[props.equipment.priority] || 'info';
});
</script>

<style scoped>
.requirement-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: white;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.requirement-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.card-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #2563eb;
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #71717a;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
