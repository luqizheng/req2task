<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Refresh, Document } from "@element-plus/icons-vue";
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

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const statusFilter = ref<string[]>([]);
const requirements = ref<RawRequirementResponseDto[]>([]);

const projectId = computed(() => route.params.id as string);

const statusOptions = [
  { value: RawRequirementStatus.PENDING, label: "待处理", color: "info" },
  { value: RawRequirementStatus.PROCESSING, label: "处理中", color: "" },
  { value: RawRequirementStatus.COMPLETED, label: "已完成", color: "success" },
  { value: RawRequirementStatus.CLARIFIED, label: "已澄清", color: "success" },
  { value: RawRequirementStatus.CONVERTED, label: "已转换", color: "success" },
  { value: RawRequirementStatus.DISCARDED, label: "已废弃", color: "info" },
  { value: RawRequirementStatus.FAILED, label: "失败", color: "danger" },
];

const collectionTypeOptions = [
  { value: CollectionType.DOCUMENT, label: "文档" },
  { value: CollectionType.INTERVIEW, label: "会面" },
  { value: CollectionType.MEETING, label: "会议" },
  { value: CollectionType.OTHER, label: "其他" },
];

const getStatusTagType = (status: string) => {
  return statusOptions.find((s) => s.value === status)?.color || "";
};

const getStatusLabel = (status: string) => {
  return statusOptions.find((s) => s.value === status)?.label || status;
};

const getCollectionTypeLabel = (type?: CollectionType) => {
  if (!type) return "-";
  return collectionTypeOptions.find((t) => t.value === type)?.label || type;
};

const getContentSummary = (content: string, maxLength = 100) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
};

const loadRequirements = async () => {
  loading.value = true;
  try {
    const params: RawRequirementListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value.join(",") || undefined,
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

const handleBack = () => {
  router.push(`/projects/${projectId.value}`);
};

onMounted(() => {
  loadRequirements();
});
</script>

<template>
  <div class="raw-requirement-list-view">
    <header class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack" class="back-btn">
          返回
        </el-button>
        <h1 class="page-title">原始需求列表</h1>
      </div>
      <div class="header-right">
        <el-button :icon="Refresh" @click="loadRequirements"> 刷新 </el-button>
      </div>
    </header>

    <main class="main-content">
      <div class="filter-bar">
        <span class="filter-label">状态筛选：</span>
        <el-select
          v-model="statusFilter"
          placeholder="全部状态"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 300px"
          @change="handleFilter"
        >
          <el-option
            v-for="s in statusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>

      <el-table
        :data="requirements"
        v-loading="loading"
        stripe
        class="requirement-table"
      >
        <el-table-column prop="content" label="需求内容" min-width="300">
          <template #default="{ row }">
            <div class="content-cell">
              <span class="content-text">{{
                getContentSummary(row.content)
              }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="collectionType" label="收集方式" width="120">
          <template #default="{ row }">
            {{ getCollectionTypeLabel(row.collectionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="questionAndAnswers" label="问答轮次" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ row.questionAndAnswers?.length || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120">
          <template #default="{ row }">
            {{ row.source || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>

      <div v-if="!loading && requirements.length === 0" class="empty-state">
        <el-icon size="48"><Document /></el-icon>
        <p>暂无原始需求</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.raw-requirement-list-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px;
  font-size: 14px;
  color: #64748b;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #2563eb;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}

.header-right {
  display: flex;
  gap: 12px;
}

.main-content {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.filter-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.requirement-table {
  margin-bottom: 16px;
}

.content-cell {
  display: flex;
  align-items: center;
}

.content-text {
  color: #1e293b;
  line-height: 1.5;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #94a3b8;
  text-align: center;
}

.empty-state .el-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .filter-bar {
    flex-wrap: wrap;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
