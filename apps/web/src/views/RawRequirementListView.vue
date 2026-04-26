<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Plus,
  Document,
  Clock,
  ChatDotRound,
  ArrowRight,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  rawRequirementsApi,
  RawRequirementStatus,
} from "@/api/rawRequirements";
import type {
  RawRequirementResponseDto,
  RawRequirementListParams,
} from "@/api/rawRequirements";
import { CollectionType } from "@req2task/dto";
import ViewHeader from "@/components/view-header.vue";
import viewContainer from "@/components/view-container.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const statusFilter = ref<string[]>([]);
const requirements = ref<RawRequirementResponseDto[]>([]);

const projectId = computed(() => route.params.id as string);

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

const loadRequirements = async () => {
  loading.value = true;
  try {
    const params: RawRequirementListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      status:
        statusFilter.value.length > 0
          ? (statusFilter.value[0] as RawRequirementStatus)
          : undefined,
    };
    const result = await rawRequirementsApi.getByProject(
      projectId.value,
      params,
    );
    requirements.value = Array.isArray(result) ? result : [];
    total.value = Array.isArray(result) ? result.length : 0;
  } catch (error) {
    ElMessage.error((error as Error).message || "加载原始需求列表失败");
    requirements.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  currentPage.value = 1;
  loadRequirements();
};

const handleReset = () => {
  statusFilter.value = [];
  currentPage.value = 1;
  loadRequirements();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadRequirements();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadRequirements();
};

const handleRowClick = (row: RawRequirementResponseDto) => {
  router.push(`/projects/${projectId.value}/raw-requirements/${row.id}/edit`);
};

onMounted(() => {
  loadRequirements();
});
</script>

<template>
  <view-container>
    <view-header title="原始需求" subtitle="收集和管理项目需求" showBack>
      <template #actions>
        <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="1"
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
          v-if="statusFilter.length > 0"
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
    </view-header>
    <div class="raw-requirement-list">
      <div class="list-body">
        <div v-if="loading" class="loading-state">
          <div class="skeleton-row" v-for="i in 5" :key="i">
            <div class="skeleton skeleton-main"></div>
            <div class="skeleton skeleton-meta"></div>
          </div>
        </div>

        <template v-else-if="requirements.length > 0">
          <div class="list-container">
            <div
              v-for="item in requirements"
              :key="item.id"
              class="list-item"
              @click="handleRowClick(item)"
            >
              <div class="item-main">
                <div class="item-content">
                  {{ item.content }}
                </div>

                <div class="item-meta">
                  <span
                    :class="['status-badge', getStatusConfig(item.status).class]"
                  >{{ getStatusConfig(item.status).label }}</span>

                  <template v-if="getCollectionTypeLabel(item.collectionType)">
                    <span class="meta-divider">·</span>
                    <span class="meta-item">{{
                      getCollectionTypeLabel(item.collectionType)
                    }}</span>
                  </template>

                  <template v-if="item.questionAndAnswers?.length">
                    <span class="meta-divider">·</span>
                    <span class="meta-item">
                      <el-icon :size="12"><ChatDotRound /></el-icon>
                      {{ item.questionAndAnswers.length }} 轮问答
                    </span>
                  </template>

                  <span class="meta-divider">·</span>
                  <span class="meta-item">
                    <el-icon :size="12"><Clock /></el-icon>
                    {{ formatDate(item.createdAt) }}
                  </span>
                </div>
              </div>

              <div class="item-action">
                <el-icon :size="16"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>

          <div class="list-footer">
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
        </template>

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
      </div>
    </div>
  </view-container>
</template>

<style scoped>
.raw-requirement-list {
  min-height: 100vh;
  background: oklch(98.5% 0.004 250);
}

.list-header {
  background: white;
  border-bottom: 1px solid oklch(92% 0.005 250);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-nav {
  padding: 12px 24px;
  border-bottom: 1px solid oklch(96% 0.004 250);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin: -6px -10px;
  border: none;
  background: none;
  color: oklch(45% 0.01 250);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.back-button:hover {
  color: oklch(25% 0.02 250);
  background: oklch(96% 0.004 250);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 600;
  color: oklch(20% 0.02 250);
  margin: 0;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 8px;
  background: oklch(96% 0.004 250);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: oklch(45% 0.01 250);
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

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px oklch(85% 0.005 250 / 0.05);
}

.skeleton-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 24px;
  background: white;
}

.skeleton {
  background: linear-gradient(
    90deg,
    oklch(96% 0.004 250) 25%,
    oklch(92% 0.005 250) 50%,
    oklch(96% 0.004 250) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-main {
  height: 16px;
  width: 80%;
}

.skeleton-meta {
  height: 12px;
  width: 40%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.list-container {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px oklch(85% 0.005 250 / 0.05);
}

.list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.15s ease;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: #f9fafb;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-content {
  font-size: 14px;
  line-height: 1.6;
  color: oklch(25% 0.02 250);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: oklch(55% 0.01 250);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-right: 8px;
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

.meta-divider {
  color: oklch(80% 0.005 250);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.item-action {
  display: flex;
  align-items: center;
  padding-left: 16px;
  color: #d1d5db;
  transition: color 0.15s ease;
}

.list-item:hover .item-action {
  color: #9ca3af;
}

.list-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

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

  .list-item {
    padding: 14px 16px;
  }

  .item-meta {
    flex-wrap: wrap;
  }
}
</style>
