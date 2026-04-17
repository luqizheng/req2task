<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Search, Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserManageStore } from '@/stores/userManage';
import type { UserListParams } from '@/api/users';
import type {
  CreateUserDto,
  UpdateUserDto,
} from '@req2task/dto';

const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  PROJECT_MANAGER: 'projectManager',
  REQUIREMENT_ANALYST: 'requirementAnalyst',
  DEVELOPER: 'developer',
  TESTER: 'tester',
} as const;

const userManageStore = useUserManageStore();
const loading = ref(false);
const searchKeyword = ref('');
const roleFilter = ref('');
const statusFilter = ref<number | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const dialogTitle = ref('添加用户');
const formRef = ref<FormInstance>();
const formData = reactive({
  id: null as string | null,
  username: '',
  email: '',
  displayName: '',
  password: '',
  role: '' as (typeof UserRole)[keyof typeof UserRole] | '',
});

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  displayName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
};

const roleOptions = [
  { value: UserRole.ADMIN, label: '管理员' },
  { value: UserRole.PROJECT_MANAGER, label: '项目经理' },
  { value: UserRole.REQUIREMENT_ANALYST, label: '需求分析师' },
  { value: UserRole.DEVELOPER, label: '开发人员' },
  { value: UserRole.TESTER, label: '测试人员' },
];

const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    [UserRole.ADMIN]: '管理员',
    [UserRole.PROJECT_MANAGER]: '项目经理',
    [UserRole.REQUIREMENT_ANALYST]: '需求分析师',
    [UserRole.DEVELOPER]: '开发人员',
    [UserRole.TESTER]: '测试人员',
  };
  return map[role] || role;
};

const getRoleTagType = (role: string) => {
  const map: Record<string, string> = {
    [UserRole.ADMIN]: 'danger',
    [UserRole.PROJECT_MANAGER]: 'primary',
    [UserRole.REQUIREMENT_ANALYST]: 'success',
    [UserRole.DEVELOPER]: 'warning',
    [UserRole.TESTER]: 'info',
  };
  return map[role] || '';
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const params: UserListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value || undefined,
      role: roleFilter.value || undefined,
      status: statusFilter.value ?? undefined,
    };
    await userManageStore.fetchUserList(params);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadUsers();
};

const handleReset = () => {
  searchKeyword.value = '';
  roleFilter.value = '';
  statusFilter.value = null;
  currentPage.value = 1;
  loadUsers();
};

const handleAdd = () => {
  dialogTitle.value = '添加用户';
  Object.assign(formData, {
    id: null,
    username: '',
    email: '',
    displayName: '',
    password: '',
    role: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: { id: string; username: string; email: string; displayName: string; role: string }) => {
  dialogTitle.value = '编辑用户';
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
    password: '',
    role: row.role,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row: { id: string; displayName: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户 "${row.displayName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await userManageStore.deleteUser(row.id);
    ElMessage.success('删除成功');
    loadUsers();
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
          const updateData: UpdateUserDto = {
            email: formData.email,
            displayName: formData.displayName,
            role: formData.role as UpdateUserDto['role'],
          };
          await userManageStore.updateUser(formData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateUserDto = {
            username: formData.username,
            email: formData.email,
            displayName: formData.displayName,
            password: formData.password,
          };
          await userManageStore.createUser(createData);
          ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        loadUsers();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadUsers();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadUsers();
};

onMounted(() => {
  loadUsers();
});
</script>

<template>
  <div class="user-manage">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="用户名/姓名/邮箱"
            clearable
            :prefix-icon="Search"
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="roleFilter"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="r in roleOptions"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="statusFilter"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
          添加用户
        </el-button>
      </div>

      <el-table :data="userManageStore.userList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="displayName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :total="userManageStore.total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80"
        class="user-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="姓名" prop="displayName">
          <el-input v-model="formData.displayName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="formData.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="r in roleOptions"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" :prop="formData.id ? '' : 'password'">
          <el-input
            v-model="formData.password"
            type="password"
            show-password
            :placeholder="formData.id ? '留空则不修改' : '请输入密码'"
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
.user-manage {
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

.user-form {
  padding-right: 16px;
}
</style>
