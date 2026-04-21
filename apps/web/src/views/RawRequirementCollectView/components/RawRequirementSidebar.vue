<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import RawRequirementCard from '@/components/entity-card/RawRequirementCard.vue';

const store = useRequirementCollectStore();

const handleSelect = (id: string) => {
  store.selectRawRequirement(store.currentRawRequirementId === id ? null : id);
};

const handleCardClick = (id: string) => {
  handleSelect(id);
};

const handleDelete = async (id: string) => {
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

const handleClarify = async (id: string) => {
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

      <RawRequirementCard
        v-for="requirement in store.rawRequirements"
        :key="requirement.id"
        :data="requirement"
        :clickable="true"
        :class="{ active: store.currentRawRequirementId === requirement.id }"
        @click="handleCardClick"
        @clarify="handleClarify"
        @delete="handleDelete"
      />
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-list {
  padding: 48px 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-list p {
  margin: 0;
}

:deep(.raw-requirement-card.active) {
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
</style>
