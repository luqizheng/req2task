<script setup lang="ts">
import { computed } from 'vue';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import CollectionSummary from './CollectionSummary.vue';
import RawRequirementList from './RawRequirementList.vue';

const store = useRequirementCollectStore();

const hasCollection = computed(() => !!store.currentCollection);
</script>

<template>
  <div class="requirement-collect-sidebar">
    <template v-if="!hasCollection">
      <div class="empty-sidebar">
        <div class="empty-icon">📊</div>
        <p>选择需求收集后，这里将显示相关信息</p>
      </div>
    </template>

    <template v-else>
      <CollectionSummary />

      <RawRequirementList />

      <div class="sidebar-section">
        <div class="section-header">
          <h3>💡 使用提示</h3>
        </div>
        <div class="tips-content">
          <ul>
            <li>在左侧输入需求，AI 会自动分析和提取关键信息</li>
            <li>如果需求不完整，AI 会生成追问问题</li>
            <li>点击追问按钮可以快速发送追问</li>
            <li>收集完成后可以转换为正式需求</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.requirement-collect-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #909399;
  background: white;
  border-radius: 8px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tips-content {
  padding: 12px 16px;
}

.tips-content ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 1.8;
}

.tips-content li {
  margin-bottom: 4px;
}
</style>
