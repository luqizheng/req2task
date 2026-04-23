<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Refresh, Goods } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { requirementsApi } from '@/api/requirements';
import { Priority, RequirementSource } from '@req2task/dto';
import type { CreateRequirementDto, RequirementResponseDto } from '@req2task/dto';
import type { RequirementListParams } from '@/api/requirements';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  requirementCreated: [];
}>();

const router = useRouter();

const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const statusFilter = ref('');
const priorityFilter = ref('');
const requirements = ref<RequirementResponseDto[]>([]);

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const formData = ref({
  title: '',
  moduleIds: [] as string[],
  description: '',
  priority: Priority.MEDIUM,
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入需求标题', trigger: 'blur' }],
};

const RequirementStatus = {
  DRAFT: 'draft',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

const statusOptions = [
  { value: RequirementStatus.DRAFT, label: '草稿', color: 'info' },
  { value: RequirementStatus.REVIEWED, label: '已评审', color: '' },
  { value: RequirementStatus.APPROVED, label: '已批准', color: 'success' },
  { value: RequirementStatus.REJECTED, label: '已拒绝', color: 'danger' },
  { value: RequirementStatus.PROCESSING, label: '进行中', color: 'warning' },
  { value: RequirementStatus.COMPLETED, label: '已完成', color: 'success' },
  { value: RequirementStatus.CANCELLED, label: '已取消', color: 'info' },
];

const priorityOptions = [
  { value: Priority.CRITICAL, label: '紧急', color: 'danger' },
  { value: Priority.HIGH, label: '高', color: 'warning' },
  { value: Priority.MEDIUM, label: '中', color: 'primary' },
  { value: Priority.LOW, label: '低', color: 'info' },
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
    const result = await requirementsApi.getListByProject(props.projectId, params);
    requirements.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error((error as Error).message || '加载需求列表失败');
  } finally {
    loading.value = false;
  }
};

const handleFilter = () => {
  currentPage.value = 1;
  loadRequirements();
};

const handleReset = () => {
  statusFilter.value = '';
  priorityFilter.value = '';
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

const handleViewDetail = (row: RequirementResponseDto) => {
  router.push(`/requirements/${row.id}`);
};

const handleAiGenerate = () => {
  router.push(`/projects/${props.projectId}/ai-generate`);
};

const handleOpenDialog = () => {
  formData.value = {
    title: '',
    moduleIds: [],
    description: '',
    priority: Priority.MEDIUM,
  };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const moduleId = formData.value.moduleIds[0];
        if (!moduleId) {
          ElMessage.warning('请选择一个所属模块');
          return;
        }
        const createData: CreateRequirementDto = {
          title: formData.value.title,
          description: formData.value.description || undefined,
          priority: formData.value.priority,
          source: RequirementSource.MANUAL,
          moduleIds: formData.value.moduleIds,
        };
        await requirementsApi.create(moduleId, createData);
        ElMessage.success('创建成功');
        dialogVisible.value = false;
        loadRequirements();
        emit('requirementCreated');
      } catch (error) {
        ElMessage.error((error as Error).message || '创建失败');
      }
    }
  });
};

const loadData = async () => {
  await loadRequirements();
};

defineExpose({ loadData });

onMounted(() => {
  loadRequirements();
});
</script>

<template>
  <div class="requirement-list">
    <div class="list-header">
      <span class="list-title">需求列表</span>
      <el-button type="primary" size="small" @click="handleOpenDialog">
        新建需求
      </el-button>
    </div>

    <div class="filter-bar">
      <el-select
        v-model="statusFilter"
        placeholder="全部状态"
        clearable
        style="width: 140px"
        @change="handleFilter"
      >
        <el-option
          v-for="s in statusOptions"
          :key="s.value"
          :label="s.label"
          :value="s.value"
        />
      </el-select>
      <el-select
        v-model="priorityFilter"
        placeholder="全部优先级"
        clearable
        style="width: 120px"
        @change="handleFilter"
      >
        <el-option
          v-for="p in priorityOptions"
          :key="p.value"
          :label="p.label"
          :value="p.value"
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
      <el-table-column prop="title" label="需求标题" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="handleViewDetail(row)">
            {{ row.title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100">
        <template #default="{ row }">
          <el-tag :type="getPriorityTagType(row.priority)" size="small">
            {{ getPriorityLabel(row.priority) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
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
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
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
      <el-icon size="48"><Goods /></el-icon>
      <p>暂无需求，试试 AI 生成</p>
      <el-button type="primary" @click="handleAiGenerate">AI 生成需求</el-button>
    </div>

    <el-dialog v-model="dialogVisible" title="创建需求" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
        <el-form-item label="需求标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入需求标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属模块" required>
          <el-cascader
            v-model="formData.moduleIds"
            :options="[]"
            :props="{ checkStrictly: true, multiple: true, value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择所属模块（可跳过）"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="formData.priority" style="width: 100%">
            <el-option
              v-for="p in priorityOptions"
              :key="p.value"
              :label="p.label"
              :value="p.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入需求描述"
            maxlength="2000"
            show-word-limit
          />
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
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.requirement-table {
  margin-bottom: 16px;
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
  margin: 0 0 16px 0;
  font-size: 14px;
}
</style>
