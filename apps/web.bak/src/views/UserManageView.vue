<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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

const roleConfig: Record<string, { label: string; tagType: string }> = {
  [UserRole.ADMIN]: { label: '管理员', tagType: 'danger' },
  [UserRole.PROJECT_MANAGER]: { label: '项目经理', tagType: 'primary' },
  [UserRole.REQUIREMENT_ANALYST]: { label: '需求分析师', tagType: 'success' },
  [UserRole.DEVELOPER]: { label: '开发人员', tagType: 'warning' },
  [UserRole.TESTER]: { label: '测试人员', tagType: 'info' },
};

const roleOptions = computed(() =>
  Object.entries(roleConfig).map(([value, { label }]) => ({ value, label }))
);

const getRoleName = (role: string) => roleConfig[role]?.label || role;
const getRoleTagType = (role: string) => roleConfig[role]?.tagType || '';

const emptyText = computed(() => {
  if (loading.value) return '加载中...';
  if (searchKeyword.value || roleFilter.value || statusFilter.value !== null) {
    return '未找到匹配的用户，请尝试调整筛选条件';
  }
  return '暂无用户数据';
});

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
  role: '' as keyof typeof UserRole | '',
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
  <main class="user-manage" role="main" aria-label="用户管理">
    <header class="page-header">
      <h1 class="page-title">用户管理</h1>
      <p class="page-subtitle">管理系统用户账户和权限</p>
    </header>

    <section class="filter-section" aria-label="筛选条件">
      <el-card class="filter-card" shadow="hover">
        <el-form :inline="true" class="filter-form" role="search">
          <el-form-item label="关键词" class="filter-item">
            <el-input
              v-model="searchKeyword"
              placeholder="用户名/姓名/邮箱"
              clearable
              :prefix-icon="Search"
              style="width: 220px"
              aria-label="搜索关键词"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色" class="filter-item">
            <el-select
              v-model="roleFilter"
              placeholder="全部"
              clearable
              style="width: 150px"
              aria-label="筛选角色"
            >
              <el-option
                v-for="r in roleOptions"
                :key="r.value"
                :label="r.label"
                :value="r.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" class="filter-item">
            <el-select
              v-model="statusFilter"
              placeholder="全部"
              clearable
              style="width: 120px"
              aria-label="筛选状态"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </section>

    <section class="table-section" aria-label="用户列表">
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-toolbar">
            <span class="table-count">
              共 {{ userManageStore.total }} 位用户
            </span>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              添加用户
            </el-button>
          </div>
        </template>

        <el-table
          :data="userManageStore.userList"
          v-loading="loading"
          stripe
          highlight-current-row
          :empty-text="emptyText"
        >
          
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="displayName" label="姓名" width="120" />
          <el-table-column prop="email" label="邮箱" min-width="160" />
          <el-table-column prop="role" label="角色" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)" size="small" effect="light">
                {{ getRoleName(row.role) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              <time :datetime="row.createdAt">
                {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
              </time>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :icon="Edit"
                @click="handleEdit(row)"
                aria-label="编辑用户"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                :icon="Delete"
                @click="handleDelete(row)"
                aria-label="删除用户"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper" v-if="userManageStore.total > 0">
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
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      destroy-on-close
      align-center
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
        class="user-form"
        aria-label="用户表单"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            :disabled="!!formData.id"
            autocomplete="username"
            aria-required="true"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="displayName">
          <el-input
            v-model="formData.displayName"
            autocomplete="name"
            aria-required="true"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="formData.email"
            type="email"
            autocomplete="email"
            aria-required="true"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select
            v-model="formData.role"
            placeholder="请选择角色"
            style="width: 100%"
            aria-required="true"
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
            :autocomplete="formData.id ? 'off' : 'new-password'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped>
.user-manage { padding: 24px; max-width: 1200px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: var(--el-text-color-primary); margin: 0 0 8px; letter-spacing: -0.02em; }
.page-subtitle { font-size: 14px; color: var(--el-text-color-secondary); margin: 0; }
.filter-section, .table-section { margin-bottom: 20px; }
.filter-card, .table-card { border-radius: 12px; border: 1px solid var(--el-border-color-lighter); overflow: hidden; }
.filter-card :deep(.el-card__body), .table-card :deep(.el-card__header) { padding: 16px 20px; }
.table-card :deep(.el-card__header) { background: var(--el-fill-color-lightest); }
.table-card :deep(.el-card__body) { padding: 0; }
.filter-form { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 0; }
.filter-item, .filter-actions { margin: 0; }
.filter-actions { margin-left: auto; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.table-count { font-size: 14px; color: var(--el-text-color-secondary); font-weight: 500; }
.table-card :deep(.el-table) { --el-table-border-color: var(--el-border-color-lighter); --el-table-header-bg-color: var(--el-fill-color-lightest); }
.table-card :deep(.el-table th.el-table__cell) { font-weight: 600; font-size: 13px; color: var(--el-text-color-regular); text-transform: uppercase; letter-spacing: 0.02em; }
.table-card :deep(.el-table td.el-table__cell) { font-size: 14px; }
.table-card :deep(.el-tag) { border-radius: 6px; font-weight: 500; }
.table-card :deep(.el-button.is-link) { font-weight: 500; transition: all 0.2s ease; }
.table-card :deep(.el-button.is-link:hover) { transform: translateY(-1px); }
.pagination-wrapper { padding: 16px 20px; display: flex; justify-content: flex-end; border-top: 1px solid var(--el-border-color-lighter); }
.user-form { padding-right: 16px; }
.user-form :deep(.el-form-item__label) { font-weight: 500; color: var(--el-text-color-regular); }
.user-form :deep(.el-input__wrapper) { border-radius: 8px; }
.user-form :deep(.el-select) { width: 100%; }
@media (max-width: 768px) {
  .user-manage { padding: 16px; }
  .filter-form { flex-direction: column; }
  .filter-actions { margin-left: 0; justify-content: flex-start; }
  .table-toolbar { flex-direction: column; align-items: flex-start; }
}
</style>
