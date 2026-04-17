<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Delete, Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import { featureModulesApi } from '@/api/featureModules';
import type { CreateFeatureModuleDto, UpdateFeatureModuleDto, FeatureModuleResponseDto } from '@req2task/dto';
import type { UserListParams } from '@/api/users';
import { useUserManageStore } from '@/stores/userManage';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const userManageStore = useUserManageStore();
const loading = ref(false);
const moduleLoading = ref(false);
const memberLoading = ref(false);

const projectId = computed(() => route.params.id as string);

const moduleDialogVisible = ref(false);
const moduleDialogTitle = ref('添加模块');
const moduleFormRef = ref<FormInstance>();
const moduleFormData = reactive({
  id: null as string | null,
  name: '',
  description: '',
  moduleKey: '',
  parentId: null as string | null,
});

const memberDialogVisible = ref(false);
const memberSearch = ref('');
const availableUsers = ref<{ id: string; displayName: string; email: string }[]>([]);

const moduleRules: FormRules = {
  name: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
  moduleKey: [
    { required: true, message: '请输入模块 Key', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9]*$/, message: '模块 Key 必须是大写字母开头', trigger: 'blur' },
  ],
};

const modules = ref<FeatureModuleResponseDto[]>([]);

const loadProject = async () => {
  loading.value = true;
  try {
    await projectStore.fetchProjectById(projectId.value);
  } finally {
    loading.value = false;
  }
};

const loadModules = async () => {
  moduleLoading.value = true;
  try {
    const data = await featureModulesApi.getList(projectId.value);
    modules.value = data.items;
  } finally {
    moduleLoading.value = false;
  }
};

const loadAvailableUsers = async () => {
  memberLoading.value = true;
  try {
    const params: UserListParams = { limit: 100 };
    await userManageStore.fetchUserList(params);
    availableUsers.value = userManageStore.userList.map(u => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
    }));
  } finally {
    memberLoading.value = false;
  }
};

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    PLANNING: 'warning',
    COMPLETED: 'info',
    ARCHIVED: '',
  };
  return map[status] || '';
};

const statusOptions = [
  { value: 'ACTIVE', label: '进行中' },
  { value: 'PLANNING', label: '规划中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ARCHIVED', label: '已归档' },
];

const handleEditProject = () => {
  ElMessage.info('编辑项目功能');
};

const handleDeleteProject = async () => {
  try {
    await ElMessageBox.confirm(
      '确定删除此项目吗？',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await projectStore.deleteProject(projectId.value);
    ElMessage.success('删除成功');
    router.push('/projects');
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleAddModule = () => {
  moduleDialogTitle.value = '添加模块';
  Object.assign(moduleFormData, {
    id: null,
    name: '',
    description: '',
    moduleKey: '',
    parentId: null,
  });
  moduleDialogVisible.value = true;
};

const handleEditModule = (row: { id: string; name: string; description: string; moduleKey: string }) => {
  moduleDialogTitle.value = '编辑模块';
  Object.assign(moduleFormData, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    moduleKey: row.moduleKey,
    parentId: null,
  });
  moduleDialogVisible.value = true;
};

const handleDeleteModule = async (row: { id: string; name: string }) => {
  try {
    await ElMessageBox.confirm(`确定删除模块 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await featureModulesApi.delete(row.id);
    ElMessage.success('删除成功');
    loadModules();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSubmitModule = async () => {
  if (!moduleFormRef.value) return;
  await moduleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (moduleFormData.id) {
          const updateData: UpdateFeatureModuleDto = {
            name: moduleFormData.name,
            description: moduleFormData.description,
          };
          await featureModulesApi.update(moduleFormData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateFeatureModuleDto = {
            name: moduleFormData.name,
            description: moduleFormData.description,
            moduleKey: moduleFormData.moduleKey,
            projectId: projectId.value,
          };
          await featureModulesApi.create(projectId.value, createData);
          ElMessage.success('创建成功');
        }
        moduleDialogVisible.value = false;
        loadModules();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleAddMember = async (userId: string) => {
  try {
    await projectStore.addMember(projectId.value, { userId });
    ElMessage.success('添加成功');
    loadProject();
  } catch (error) {
    ElMessage.error((error as Error).message || '添加失败');
  }
};

const handleRemoveMember = async (userId: string) => {
  try {
    await ElMessageBox.confirm('确定移除此成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await projectStore.removeMember(projectId.value, userId);
    ElMessage.success('移除成功');
    loadProject();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '移除失败');
    }
  }
};

onMounted(async () => {
  await Promise.all([loadProject(), loadModules()]);
});
</script>

<template>
  <div class="project-detail" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.push('/projects')">返回</el-button>
      <h2 class="page-title">{{ projectStore.currentProject?.name || '项目详情' }}</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit" @click="handleEditProject">编辑</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDeleteProject">删除</el-button>
      </div>
    </div>

    <div class="detail-content">
      <el-card class="info-card">
        <template #header>
          <span class="card-title">项目信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目 Key">
            <el-tag type="info">{{ projectStore.currentProject?.projectKey }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(projectStore.currentProject?.status || '')">
              {{ statusOptions.find(s => s.value === projectStore.currentProject?.status)?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ projectStore.currentProject?.description || '暂无描述' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ projectStore.currentProject?.createdAt ? new Date(projectStore.currentProject.createdAt).toLocaleString() : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ projectStore.currentProject?.updatedAt ? new Date(projectStore.currentProject.updatedAt).toLocaleString() : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="member-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">成员管理</span>
            <el-button type="primary" size="small" :icon="Plus" @click="loadAvailableUsers(); memberDialogVisible = true">
              添加成员
            </el-button>
          </div>
        </template>
        <div class="member-list">
          <div v-if="!projectStore.currentProject?.members?.length" class="empty-tip">
            暂无成员
          </div>
          <div v-for="member in projectStore.currentProject?.members" :key="member.id" class="member-item">
            <el-avatar size="small">{{ member.displayName?.charAt(0) || '?' }}</el-avatar>
            <div class="member-info">
              <div class="member-name">{{ member.displayName }}</div>
              <div class="member-email">{{ member.email }}</div>
            </div>
            <el-button type="danger" link size="small" @click="handleRemoveMember(member.id)">移除</el-button>
          </div>
        </div>
      </el-card>

      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">功能模块</span>
            <el-button type="primary" size="small" :icon="Plus" @click="handleAddModule">
              添加模块
            </el-button>
          </div>
        </template>
        <el-table :data="modules" v-loading="moduleLoading" stripe>
          <el-table-column prop="name" label="模块名称" min-width="150" />
          <el-table-column prop="moduleKey" label="模块 Key" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.moduleKey }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEditModule(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="handleDeleteModule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="moduleDialogVisible" :title="moduleDialogTitle" width="500px" destroy-on-close>
      <el-form ref="moduleFormRef" :model="moduleFormData" :rules="moduleRules" label-width="80">
        <el-form-item label="模块名称" prop="name">
          <el-input v-model="moduleFormData.name" />
        </el-form-item>
        <el-form-item label="模块 Key" prop="moduleKey" v-if="!moduleFormData.id">
          <el-input v-model="moduleFormData.moduleKey" placeholder="如: MOD" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="moduleFormData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitModule">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memberDialogVisible" title="添加成员" width="500px" destroy-on-close>
      <el-input v-model="memberSearch" placeholder="搜索成员" clearable style="margin-bottom: 16px" />
      <div class="available-members">
        <div
          v-for="user in availableUsers.filter(u =>
            !projectStore.currentProject?.members?.some(m => m.id === u.id) &&
            (u.displayName.includes(memberSearch) || u.email.includes(memberSearch))
          )"
          :key="user.id"
          class="member-item"
        >
          <el-avatar size="small">{{ user.displayName?.charAt(0) || '?' }}</el-avatar>
          <div class="member-info">
            <div class="member-name">{{ user.displayName }}</div>
            <div class="member-email">{{ user.email }}</div>
          </div>
          <el-button type="primary" size="small" @click="handleAddMember(user.id)">添加</el-button>
        </div>
        <div v-if="!availableUsers.length" class="empty-tip">暂无可添加的成员</div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.project-detail {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.member-list,
.available-members {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: #f8fafc;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #1e293b;
}

.member-email {
  font-size: 12px;
  color: #64748b;
}

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
}
</style>
