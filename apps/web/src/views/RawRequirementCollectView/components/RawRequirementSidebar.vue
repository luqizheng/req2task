<script setup lang="ts">
import { Delete, Check } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import type { RawRequirementStatus } from '@/api/requirementCollection';

const store = useRequirementCollectStore();

const statusMap: Record<RawRequirementStatus, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'info' },
  processing: { label: '分析中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  clarified: { label: '已澄清', type: 'success' },
  converted: { label: '已转换', type: 'success' },
  discarded: { label: '已删除', type: 'info' },
  failed: { label: '失败', type: 'danger' },
};

const handleSelect = (id: string) => {
  store.selectRawRequirement(store.currentRawRequirementId === id ? null : id);
};

const handleDelete = async (id: string, event: Event) => {
  event.stopPropagation();
  try {
    await ElMessageBox.confirm('确定要删除这个需求吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.deleteRequirement(id);
    ElMessage.success('删除成功');
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleClarify = async (id: string, event: Event) => {
  event.stopPropagation();
  try {
    await ElMessageBox.confirm('确定要标记这个需求为已澄清吗？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    });
    const raw = store.rawRequirements.find(r => r.id === id);
    if (raw) {
      await store.clarifyRequirement(id, raw.content);
      ElMessage.success('已标记为澄清');
    }
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const truncateContent = (content: string, maxLength: number = 80) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
};

const isClarified = (status: RawRequirementStatus) => {
  return status === 'clarified' || status === 'converted' || status === 'discarded';
};
</script>

<template>
  <div class="raw-requirement-sidebar">
    <div class="sidebar-header">
      <h3>📋 原始需求</h3>
      <span class="count-badge">{{ store.rawRequirements.length }}</span>
    </div>

    <div class="sidebar-content">
      <div v-if="store.rawRequirements.length === 0" class="empty-list">
        <p>暂无原始需求</p>
      </div>

      <div
        v-for="requirement in store.rawRequirements"
        :key="requirement.id"
        :class="['requirement-item', { active: store.currentRawRequirementId === requirement.id }]"
        @click="handleSelect(requirement.id)"
      >
        <div class="item-header">
          <el-tag :type="statusMap[requirement.status].type" size="small">
            {{ statusMap[requirement.status].label }}
          </el-tag>
          <span class="item-time">{{ formatTime(requirement.createdAt) }}</span>
        </div>

        <div class="item-content">
          {{ truncateContent(requirement.content) }}
        </div>

        <div v-if="requirement.source" class="item-source">
          来源：{{ requirement.source }}
        </div>

        <div class="item-actions">
          <el-button
            v-if="!isClarified(requirement.status)"
            :icon="Check"
            text
            size="small"
            type="success"
            @click="handleClarify(requirement.id, $event)"
            title="标记为已澄清"
          />
          <el-button
            :icon="Delete"
            text
            size="small"
            type="danger"
            @click="handleDelete(requirement.id, $event)"
            title="删除需求"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw-requirement-sidebar {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.count-badge {
  padding: 2px 10px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-list {
  padding: 48px 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-list p {
  margin: 0;
}

.requirement-item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background 0.2s;
}

.requirement-item:hover {
  background: var(--el-fill-color-light);
}

.requirement-item.active {
  background: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 13px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.item-content {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  margin-bottom: 4px;
}

.item-source {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.item-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
</style>
