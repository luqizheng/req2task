<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  Plus,
  Document,
  Clock,
  ChatDotRound,
} from "@element-plus/icons-vue";
import { RawRequirementStatus } from "@/api/rawRequirements";

import { CollectionType } from "@req2task/dto";
import ViewContainer from "@/components/view-container.vue";
import { useRawRequirementList } from "./useRawRequirementList";

const router = useRouter();

const {
  loading,
  total,
  currentPage,
  pageSize,
  statusFilter,
  requirements,
  projectId,
  handleFilter,
  handleReset,
  handlePageChange,
  handleSizeChange,
} = useRawRequirementList();

const statusConfig: Record<string, { label: string; class: string }> = {
  [RawRequirementStatus.PENDING]: { label: "待处理", class: "status-pending" },
  [RawRequirementStatus.PROCESSING]: {
    label: "处理中",
    class: "status-processing",
  },
  [RawRequirementStatus.COMPLETED]: {
    label: "已完成",
    class: "status-completed",
  },
  [RawRequirementStatus.CLARIFIED]: {
    label: "已澄清",
    class: "status-completed",
  },
  [RawRequirementStatus.CONVERTED]: {
    label: "已转换",
    class: "status-converted",
  },
  [RawRequirementStatus.DISCARDED]: {
    label: "已废弃",
    class: "status-discarded",
  },
  [RawRequirementStatus.FAILED]: { label: "失败", class: "status-failed" },
};

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
}));

const collectionTypeLabels: Record<CollectionType, string> = {
  [CollectionType.DOCUMENT]: "文档",
  [CollectionType.INTERVIEW]: "会面",
  [CollectionType.MEETING]: "会议",
  [CollectionType.OTHER]: "其他",
};

const getStatusConfig = (status: string) =>
  statusConfig[status] || { label: status, class: "" };

const getCollectionTypeLabel = (type?: CollectionType) => {
  if (!type) return null;
  return collectionTypeLabels[type] || type;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};


</script>

<template>
  <ViewContainer title="原始需求" subtitle="收集和管理项目需求" showBack>
    <template #actions>
      <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          class="status-select"
          @change="handleFilter"
        >
        <el-option
          v-for="s in statusOptions"
          :key="s.value"
          :label="s.label"
          :value="s.value"
        />
      </el-select>

      <el-button
        v-if="statusFilter !== undefined"
        text
        @click="handleReset"
        class="reset-btn"
      >
        重置
      </el-button>

      <el-button
        type="primary"
        @click="router.push(`/projects/${projectId}/raw-requirements/create`)"
      >
        <el-icon :size="16" class="mr-1"><Plus /></el-icon>
        新增需求
      </el-button>
    </template>
    <div class="raw-requirement-list">
      <div class="list-body">
        <el-table
          v-if="!loading && requirements.length > 0"
          :data="requirements"
          stripe
          border
          style="width: 100%"
          class="requirement-table"
        >
        <el-table-column prop="id" label="ID" width="120">
          <template #default="scope">
         
            <a :href="`/projects/${projectId}/raw-requirements/${scope.row.id}`">
             eye
            </a>
            <a :href="`/projects/${projectId}/raw-requirements/${scope.row.id}/edit`">
              edit
            </a>
          
          </template>
        </el-table-column>
          <el-table-column prop="content" label="需求内容" min-width="400">
            <template #default="scope">
              <div class="content-cell">
                <a :href="`/projects/${projectId}/raw-requirements/${scope.row.id}`" class="content-link">
                  {{ scope.row.content }}
                </a>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <span
                :class="[
                  'status-badge',
                  getStatusConfig(scope.row.status).class,
                ]"
              >
                {{ getStatusConfig(scope.row.status).label }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="collectionType" label="来源类型" width="100">
            <template #default="scope">
              {{ getCollectionTypeLabel(scope.row.collectionType) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="questionAndAnswers" label="问答轮次" width="120">
            <template #default="scope">
              <span class="meta-item">
                <el-icon :size="12"><ChatDotRound /></el-icon>
                {{ scope.row.questionAndAnswers?.length || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="140">
            <template #default="scope">
              <span class="meta-item">
                <el-icon :size="12"><Clock /></el-icon>
                {{ formatDate(scope.row.createdAt) }}
              </span>
            </template>
          </el-table-column>
        </el-table>

        <el-skeleton :rows="5" animated v-else-if="loading" style="width: 100%" />

        <div v-else class="empty-state">
          <div class="empty-icon">
            <el-icon :size="48"><Document /></el-icon>
          </div>
          <h3>暂无原始需求</h3>
          <p>开始收集项目需求，为后续分析做准备</p>
          <el-button
            type="primary"
            @click="
              router.push(`/projects/${projectId}/raw-requirements/create`)
            "
          >
            <el-icon :size="16" class="mr-1"><Plus /></el-icon>
            新增需求
          </el-button>
        </div>

        <div class="list-footer" v-if="!loading && requirements.length > 0">
          <el-pagination
            :total="total"
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
            background
            small
          />
        </div>
      </div>
    </div>
  </ViewContainer>
</template>

<style scoped>
.raw-requirement-list {
  min-height: 100vh;
  background: oklch(98.5% 0.004 250);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  width: 160px;
}

.status-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px oklch(88% 0.005 250);
}

.status-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px oklch(75% 0.01 250);
}

.reset-btn {
  color: oklch(45% 0.01 250);
  font-size: 13px;
}

.reset-btn:hover {
  color: oklch(30% 0.02 250);
}

.mr-1 {
  margin-right: 4px;
}

.list-body {
  margin: 0 auto;
  padding: 24px;
}

.requirement-table {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px oklch(85% 0.005 250 / 0.05);
}

.requirement-table :deep(.el-table__header-wrapper) {
  background-color: oklch(96% 0.004 250);
}

.requirement-table :deep(.el-table__header-wrapper th) {
  background-color: oklch(96% 0.004 250);
  color: oklch(25% 0.02 250);
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid oklch(92% 0.005 250);
}

.requirement-table :deep(.el-table__body-wrapper tr) {
  transition: background-color 0.15s ease;
}

.requirement-table :deep(.el-table__body-wrapper tr:hover) {
  background-color: oklch(96% 0.004 250);
}

.requirement-table :deep(.el-table__body-wrapper td) {
  color: oklch(35% 0.02 250);
  font-size: 13px;
  border-bottom: 1px solid oklch(94% 0.005 250);
}

.content-cell {
    font-size: 14px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .content-link {
    color: oklch(25% 0.02 250);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .content-link:hover {
    color: oklch(35% 0.15 250);
    text-decoration: underline;
  }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: oklch(92% 0.01 250);
  color: oklch(40% 0.02 250);
}

.status-processing {
  background: oklch(88% 0.08 250);
  color: oklch(35% 0.15 250);
  animation: pulse-badge 2s infinite;
}

.status-completed {
  background: oklch(90% 0.06 145);
  color: oklch(35% 0.12 145);
}

.status-converted {
  background: oklch(90% 0.08 285);
  color: oklch(35% 0.15 285);
}

.status-discarded {
  background: oklch(94% 0.005 250);
  color: oklch(50% 0.01 250);
}

.status-failed {
  background: oklch(90% 0.08 25);
  color: oklch(35% 0.15 25);
}

@keyframes pulse-badge {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: oklch(55% 0.01 250);
}

.list-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: oklch(96% 0.006 250);
  border-radius: 16px;
  margin-bottom: 20px;
  color: oklch(55% 0.15 250);
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: oklch(20% 0.02 250);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: oklch(45% 0.01 250);
  margin: 0 0 24px;
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .status-select {
    flex: 1;
  }

  .list-body {
    padding: 16px;
  }

  .requirement-table {
    font-size: 12px;
  }

  .content-cell {
    font-size: 12px;
  }
}
</style>
