<script setup lang="ts">
import { computed } from 'vue';
import { ElButton } from 'element-plus';
import {
  ChatDotRound,
  Check,
  Delete,
} from '@element-plus/icons-vue';
import type { RawRequirementInCollection, RawRequirementStatus } from '@/api/requirementCollection';

const statusConfig: Record<RawRequirementStatus, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  PENDING: { label: '待处理', type: 'info' },
  PROCESSING: { label: '分析中', type: 'warning' },
  COMPLETED: { label: '已完成', type: 'success' },
  CLARIFIED: { label: '已澄清', type: 'success' },
  CONVERTED: { label: '已转换', type: 'success' },
  DISCARDED: { label: '已废弃', type: 'info' },
  FAILED: { label: '失败', type: 'danger' },
};

const props = defineProps<{
  data: RawRequirementInCollection;
  clickable?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
  clarify: [id: string];
  delete: [id: string];
}>();

const statusInfo = computed(() => statusConfig[props.data.status as RawRequirementStatus] || { label: props.data.status, type: 'info' });

const handleClick = () => {
  if (props.clickable !== false) {
    emit('click', props.data.id);
  }
};

const handleClarify = (e: Event) => {
  e.stopPropagation();
  emit('clarify', props.data.id);
};

const handleDelete = (e: Event) => {
  e.stopPropagation();
  emit('delete', props.data.id);
};

const isClarified = computed(() =>
  ['CLARIFIED', 'CONVERTED', 'DISCARDED'].includes(props.data.status)
);

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
};

const truncateContent = (content: string, maxLength: number = 120) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};
</script>

<template>
  <div
    class="raw-requirement-card"
    :class="{ clickable: clickable !== false }"
    @click="handleClick"
  >
    <div class="card-header">
      <div class="header-left">
        <el-tag :type="statusInfo.type" size="small" class="status-tag">
          {{ statusInfo.label }}
        </el-tag>
        <span v-if="data.source" class="source-label">{{ data.source }}</span>
      </div>
      <div class="header-right">
        <span class="time-label">{{ formatTime(data.createdAt) }}</span>
      </div>
    </div>

    <div class="card-body">
      <p class="content-text">{{ truncateContent(data.content) }}</p>

      <div class="meta-row">
        <div v-if="data.questionCount > 0" class="meta-item">
          <ChatDotRound class="meta-icon" />
          <span>{{ data.questionCount }} 个追问</span>
        </div>
        <div v-if="data.sessionHistory?.length" class="meta-item">
          <span class="chat-count">{{ Math.ceil(data.sessionHistory.length / 2) }} 轮对话</span>
        </div>
      </div>

      <div v-if="data.keyElements?.length" class="tags-row">
        <el-tag
          v-for="(element, index) in data.keyElements.slice(0, 3)"
          :key="index"
          size="small"
          type="info"
          class="element-tag"
        >
          {{ element }}
        </el-tag>
        <el-tag v-if="data.keyElements.length > 3" size="small" type="info" class="element-tag">
          +{{ data.keyElements.length - 3 }}
        </el-tag>
      </div>

      <div v-if="data.clarifiedContent" class="clarified-preview">
        <span class="preview-label">澄清摘要：</span>
        <span class="preview-text">{{ truncateContent(data.clarifiedContent, 80) }}</span>
      </div>
    </div>

    <div class="card-footer">
      <div class="footer-left">
        <slot name="footer-left" />
      </div>
      <div class="footer-actions">
        <slot name="actions">
          <el-button
            v-if="!isClarified"
            text
            size="small"
            type="success"
            :icon="Check"
            @click="handleClarify"
          >
            澄清
          </el-button>
          <el-button
            text
            size="small"
            type="danger"
            :icon="Delete"
            @click="handleDelete"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw-requirement-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.raw-requirement-card:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.raw-requirement-card.clickable {
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
}

.status-tag {
  border-radius: 4px;
  font-weight: 500;
}

.source-label {
  font-size: 12px;
  color: #909399;
}

.time-label {
  font-size: 12px;
  color: #c0c4cc;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.content-text {
  margin: 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-break: break-word;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.meta-icon {
  width: 14px;
  height: 14px;
}

.chat-count {
  color: #606266;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.element-tag {
  border-radius: 4px;
}

.clarified-preview {
  padding: 8px 10px;
  background: #f0f9eb;
  border-radius: 4px;
  font-size: 12px;
}

.preview-label {
  color: #67c23a;
  font-weight: 500;
}

.preview-text {
  color: #606266;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
