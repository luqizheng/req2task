<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search, Plus, Delete, Refresh, Document } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementStore } from '@/stores/requirement';
import type { RequirementListParams } from '@/api/requirements';
import type { CreateRequirementDto, UpdateRequirementDto } from '@req2task/dto';

const Route = useRoute();
const router = useRouter();
const requirementStore = useRequirementStore();
const loading = ref(false);
const searchKeyword = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const moduleId = computed(() => Route.params.moduleId as string);
const projectId = computed(() => Route.params.projectId as string);

const dialogVisible = ref(false);
const dialogTitle = ref('创建需求');
const formRef = ref<FormInstance>();
const formData = reactive({
  id: null as string | null,
  title: '',
  description: '',
  priority: 'medium',
  source: 'manual',
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
};

const Priority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

const RequirementStatus = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const priorityOptions = [
  { value: Priority.CRITICAL, label: '紧急', color: 'danger' },
  { value: Priority.HIGH, label: '高', color: 'warning' },
  { value: Priority.MEDIUM, label: '中', color: 'primary' },
  { value: Priority.LOW, label: '低', color: 'info' },
];

const statusOptions = [
  { value: RequirementStatus.DRAFT, label: '草稿', color: 'info' },
  { value: RequirementStatus.REVIEWED, label: '已评审', color: '' },
  { value: RequirementStatus.APPROVED, label: '已批准', color: 'success' },
  { value: RequirementStatus.REJECTED, label: '已拒绝', color: 'danger' },
  { value: RequirementStatus.PROCESSING, label: '进行中', color: 'warning' },
  { value: RequirementStatus.COMPLETED, label: '已完成', color: 'success' },
  { value: RequirementStatus.CANCELLED, label: '已取消', color: 'info' },
];

const getPriorityTagType = (priority: string) => {
  return priorityOptions.find(p => p.value === priority)?.color || '';
};

const getStatusTagType = (status: string) => {
  return statusOptions.find(s => s.value === status)?.color || '';
};

const getPriorityLabel = (priority: string) => {
  return priorityOptions.find(p => p.value === priority)?.label || priority;
};

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status;
};

const loadRequirements = async () => {
  loading.value = true;
  try {
    const params: RequirementListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      status: statusFilter.value || undefined,
      priority: priorityFilter.value || undefined,
    };
    await requirementStore.fetchRequirementList(moduleId.value, params);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadRequirements();
};

const handleReset = () => {
  searchKeyword.value = '';
  statusFilter.value = '';
  priorityFilter.value = '';
  currentPage.value = 1;
  loadRequirements();
};

const handleAdd = () => {
  dialogTitle.value = '创建需求';
  Object.assign(formData, {
    id: null,
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    source: 'manual',
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: { id: string; title: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定删除需求 "${row.title}" 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await requirementStore.deleteRequirement(row.id);
    ElMessage.success('删除成功');
    loadRequirements();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          const updateData: UpdateRequirementDto = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority as UpdateRequirementDto['priority'],
          };
          await requirementStore.updateRequirement(formData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateRequirementDto = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority as CreateRequirementDto['priority'],
            source: formData.source as CreateRequirementDto['source'],
          };
          await requirementStore.createRequirement(moduleId.value, createData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadRequirements();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
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

const handleViewDetail = (row: { id: string }) => {
  router.push(`/requirements/${row.id}`);
};

onMounted(() => {
  loadRequirements();
});
</script>

<template>
  <div class="requirement-list">
    <div class="page-header">
      <el-button @click="router.push(`/projects/${projectId}`)">返回</el-button>
      <h2 class="page-title">需求列表</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="priorityFilter" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">创建需求</el-button>
      </div>

      <el-table :data="requirementStore.requirementList" v-loading="loading" stripe>
        <el-table-column prop="title" label="需求标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewDetail(row)">{{ row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">{{ getPriorityLabel(row.priority) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storyPoints" label="故事点" width="80" />
        <el-table-column prop="userStoryCount" label="用户故事" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.userStoryCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Document" @click="handleViewDetail(row)">详情</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="requirementStore.total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
        <el-form-item label="需求标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入需求标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入需求描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="formData.priority" style="width: 100%">
            <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.requirement-list {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-form {
  margin-bottom: 0;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.table-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
