<script setup lang="ts">
import { ref } from 'vue';
import { Delete, Check, ArrowRight } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import type { RawRequirementStatus } from '@/api/requirementCollection';

const store = useRequirementCollectStore();
const expandedId = ref<string | null>(null);

const statusMap: Record<RawRequirementStatus, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'info' },
  processing: { label: '分析中', type: 'warning' },
  clarified: { label: '已澄清', type: 'success' },
  converted: { label: '已转换', type: 'success' },
  discarded: { label: '已删除', type: 'info' },
};

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
  store.selectRawRequirement(expandedId.value);
};

const handleDelete = async (id: string, event: Event) => {
  event.stopPropagation();
  try {
    await ElMessageBox.confirm(
      '确定要删除这个需求吗？',
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
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
    await ElMessageBox.confirm(
      '确定要标记这个需求为已澄清吗？',
      '确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' }
    );
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

const truncateContent = (content: string, maxLength: number = 100) => {
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
  <div class="raw-requirement-list">
    <div class="list-header">
      <h3>📝 原始需求列表</h3>
      <span class="count-badge">{{ store.rawRequirements.length }}</span>
    </div>

    <div class="list-content">
      <div v-if="store.rawRequirements.length === 0" class="empty-list">
        <p>暂无原始需求</p>
        <p class="hint">在左侧对话框中输入需求开始收集</p>
      </div>

      <div
        v-for="requirement in store.rawRequirements"
        :key="requirement.id"
        :class="['requirement-item', { active: expandedId === requirement.id }]"
        @click="toggleExpand(requirement.id)"
      >
        <div class="item-header">
          <el-tag :type="statusMap[requirement.status].type" size="small">
            {{ statusMap[requirement.status].label }}
          </el-tag>
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
          <span class="item-time">{{ formatTime(requirement.createdAt) }}</span>
        </div>

        <div class="item-content">
          {{ truncateContent(requirement.content) }}
        </div>

        <div v-if="requirement.source" class="item-source">
          来源：{{ requirement.source }}
        </div>

        <transition name="expand">
          <div v-if="expandedId === requirement.id" class="item-expanded">
            <div v-if="requirement.sessionHistory?.length > 0" class="session-info">
              <span class="info-label">对话轮次：</span>
              <span>{{ requirement.sessionHistory.length / 2 }} 轮</span>
            </div>

            <div v-if="requirement.keyElements?.length > 0" class="key-elements">
              <span class="info-label">关键词：</span>
              <el-tag
                v-for="(element, index) in requirement.keyElements"
                :key="index"
                size="small"
                class="element-tag"
              >
                {{ element }}
              </el-tag>
            </div>

            <div v-if="requirement.followUpQuestions?.length > 0" class="follow-up-count">
              <span class="info-label">追问问题：</span>
              <span>{{ requirement.followUpQuestions.length }} 个</span>
            </div>

            <div v-if="requirement.generatedContent" class="generated-summary">
              <span class="info-label">AI 摘要：</span>
              <div class="summary-text">{{ requirement.generatedContent }}</div>
            </div>

            <div class="full-content">
              <span class="info-label">完整内容：</span>
              <div class="content-text">{{ requirement.content }}</div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw-requirement-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.list-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.count-badge {
  padding: 2px 8px;
  background: #409eff;
  color: white;
  border-radius: 10px;
  font-size: 12px;
}

.list-content {
  max-height: 400px;
  overflow-y: auto;
}

.empty-list {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.empty-list p {
  margin: 0;
}

.empty-list .hint {
  margin-top: 8px;
  font-size: 12px;
}

.requirement-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.requirement-item:hover {
  background: #fafafa;
}

.requirement-item.active {
  background: #ecf5ff;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.item-time {
  font-size: 12px;
  color: #909399;
}

.item-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.item-source {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.item-expanded {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.info-label {
  color: #909399;
  font-size: 12px;
}

.session-info,
.follow-up-count {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 12px;
}

.key-elements {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.element-tag {
  margin-right: 0;
}

.generated-summary,
.full-content {
  margin-top: 8px;
}

.summary-text,
.content-text {
  margin-top: 4px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
