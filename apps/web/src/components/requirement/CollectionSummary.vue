<script setup lang="ts">
import { computed } from 'vue';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import type { CollectionType } from '@/api/requirementCollection';

const store = useRequirementCollectStore();

const collection = computed(() => store.currentCollection);

const collectionTypeMap: Record<CollectionType, { label: string; icon: string }> = {
  meeting: { label: '会议', icon: '📅' },
  interview: { label: '访谈', icon: '💬' },
  document: { label: '文档', icon: '📄' },
  other: { label: '其他', icon: '📌' },
};

const collectionTypeInfo = computed(() => {
  if (!collection.value) return null;
  return collectionTypeMap[collection.value.collectionType] || collectionTypeMap.other;
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <div v-if="collection" class="collection-summary">
    <div class="summary-header">
      <h3>📋 收集摘要</h3>
    </div>

    <div class="summary-content">
      <div class="summary-item">
        <span class="item-label">收集标题</span>
        <span class="item-value title">{{ collection.title }}</span>
      </div>

      <div class="summary-item">
        <span class="item-label">收集类型</span>
        <span class="item-value">
          <span class="type-badge">
            {{ collectionTypeInfo?.icon }} {{ collectionTypeInfo?.label }}
          </span>
        </span>
      </div>

      <div class="summary-item">
        <span class="item-label">收集人</span>
        <span class="item-value">{{ collection.collectedBy?.displayName || '未知' }}</span>
      </div>

      <div class="summary-item">
        <span class="item-label">收集时间</span>
        <span class="item-value">{{ formatDate(collection.collectedAt) }}</span>
      </div>

      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-value">{{ collection.rawRequirementCount }}</div>
          <div class="stat-label">原始需求</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ store.chatRoundCount }}</div>
          <div class="stat-label">对话轮次</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">
            {{ collection.rawRequirementCount > 0 ? Math.round((collection.rawRequirementCount / Math.max(collection.rawRequirementCount, 1)) * 100) : 0 }}
          </div>
          <div class="stat-label">完成度</div>
        </div>
      </div>

      <div v-if="collection.meetingMinutes" class="meeting-minutes">
        <span class="item-label">会议纪要</span>
        <div class="minutes-content">{{ collection.meetingMinutes }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-summary {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.summary-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.summary-content {
  padding: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-label {
  color: #909399;
  font-size: 13px;
  flex-shrink: 0;
}

.item-value {
  color: #303133;
  font-size: 13px;
  text-align: right;
}

.item-value.title {
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
}

.summary-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16px 0;
  margin-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e4e7ed;
}

.meeting-minutes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.minutes-content {
  margin-top: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
