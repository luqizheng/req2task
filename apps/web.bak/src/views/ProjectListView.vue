<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Plus, Delete, Refresh, FolderOpened } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import type { ProjectListParams } from '@/api/projects';
import type { CreateProjectDto, UpdateProjectDto } from '@req2task/dto';

const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

const router = useRouter();
const projectStore = useProjectStore();
const loading = ref(false);
const searchKeyword = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const dialogTitle = ref('创建项目');
const formRef = ref<FormInstance>();
const formData = reactive({
  id: null as string | null,
  name: '',
  description: '',
  projectKey: '',
  status: ProjectStatus.ACTIVE,
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
  ],
  projectKey: [
    { required: true, message: '请输入项目 Key', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9]*$/, message: '项目 Key 必须是大写字母开头，只包含大写字母和数字', trigger: 'blur' },
  ],
};

const statusOptions = [
  { value: ProjectStatus.ACTIVE, label: '进行中' },
  { value: ProjectStatus.PLANNING, label: '规划中' },
  { value: ProjectStatus.COMPLETED, label: '已完成' },
  { value: ProjectStatus.ARCHIVED, label: '已归档' },
];

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    [ProjectStatus.ACTIVE]: 'success',
    [ProjectStatus.PLANNING]: 'warning',
    [ProjectStatus.COMPLETED]: 'info',
    [ProjectStatus.ARCHIVED]: '',
  };
  return map[status] || '';
};

const loadProjects = async () => {
  loading.value = true;
  try {
    const params: ProjectListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value || undefined,
    };
    await projectStore.fetchProjectList(params);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadProjects();
};

const handleReset = () => {
  searchKeyword.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
  loadProjects();
};

const handleAdd = () => {
  dialogTitle.value = '创建项目';
  Object.assign(formData, {
    id: null,
    name: '',
    description: '',
    projectKey: '',
    status: ProjectStatus.ACTIVE,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: { id: string; name: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定删除项目 "${row.name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await projectStore.deleteProject(row.id);
    ElMessage.success('删除成功');
    loadProjects();
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
          const updateData: UpdateProjectDto = {
            name: formData.name,
            description: formData.description,
            status: formData.status as UpdateProjectDto['status'],
          };
          await projectStore.updateProject(formData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateProjectDto = {
            name: formData.name,
            description: formData.description,
            projectKey: formData.projectKey,
            status: formData.status as CreateProjectDto['status'],
          };
          await projectStore.createProject(createData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadProjects();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadProjects();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadProjects();
};

const handleViewDetail = (row: { id: string }) => {
  router.push(`/projects/${row.id}`);
};

onMounted(() => {
  loadProjects();
});
</script>

<template>
  <div class="project-list">
    <div class="page-header">
      <h2 class="page-title">项目管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="项目名称/Key"
            clearable
            :prefix-icon="Search"
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="statusFilter"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          创建项目
        </el-button>
      </div>

      <el-table :data="projectStore.projectList" v-loading="loading" stripe>
        <el-table-column prop="name" label="项目名称" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewDetail(row)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="projectKey" label="项目 Key" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.projectKey }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ statusOptions.find(s => s.value === row.status)?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="members" label="成员" width="100">
          <template #default="{ row }">
            <el-avatar-group size="small" :max="3">
              <el-avatar
                v-for="member in row.members?.slice(0, 3)"
                :key="member.id"
                :title="member.displayName"
              >
                {{ member.displayName?.charAt(0) || '?' }}
              </el-avatar>
            </el-avatar-group>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="FolderOpened" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="projectStore.total"
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
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80" class="project-form">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目 Key" prop="projectKey" v-if="!formData.id">
          <el-input v-model="formData.projectKey" placeholder="如: PROJ" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="状态" v-if="formData.id">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
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
.project-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
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

.project-form {
  padding-right: 16px;
}
</style>
