<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import type { CollectionType } from '@/api/requirementCollection';

const store = useRequirementCollectStore();

const collection = computed(() => store.currentCollection);
const isExpanded = ref(false);

const collectionTypeMap: Record<CollectionType, { label: string }> = {
  meeting: { label: '会议' },
  interview: { label: '访谈' },
  document: { label: '文档' },
  other: { label: '其他' },
};

const collectionTypeInfo = computed(() => {
  if (!collection.value) return null;
  return collectionTypeMap[collection.value.collectionType] || collectionTypeMap.other;
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div v-if="collection" class="collection-summary">
    <div class="summary-header" @click="toggleExpand">
      <div class="header-left">
        <span class="collection-title">{{ collection.title }}</span>
        <span class="collection-meta">
          {{ collectionTypeInfo?.label }} · {{ formatDate(collection.collectedAt) }}
        </span>
      </div>
      <div class="header-right">
        <span class="stat-badge">{{ collection.rawRequirementCount }} 条</span>
        <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
          <ArrowDown />
        </el-icon>
      </div>
    </div>

    <transition name="expand">
      <div v-if="isExpanded" class="summary-detail">
        <div class="detail-row">
          <span class="detail-label">收集人</span>
          <span class="detail-value">{{ collection.collectedBy?.displayName || '未知' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">对话轮次</span>
          <span class="detail-value">{{ store.chatRoundCount }}</span>
        </div>
        <div v-if="collection.meetingMinutes" class="detail-row meeting-minutes">
          <span class="detail-label">会议纪要</span>
          <div class="minutes-content">{{ collection.meetingMinutes }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.collection-summary {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  cursor: pointer;
  user-select: none;
}

.summary-header:hover {
  background: #ecf5ff;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.collection-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-meta {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.stat-badge {
  padding: 2px 8px;
  background: #409eff;
  color: white;
  border-radius: 10px;
  font-size: 12px;
}

.expand-icon {
  transition: transform 0.2s;
  color: #909399;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.summary-detail {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 13px;
  color: #909399;
}

.detail-value {
  font-size: 13px;
  color: #606266;
}

.meeting-minutes {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.minutes-content {
  width: 100%;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
