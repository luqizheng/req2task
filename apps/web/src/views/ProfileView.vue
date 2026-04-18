<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Edit, Check, Close } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useUserManageStore } from '@/stores/userManage';

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
const isEditing = ref(false);

const profileFormRef = ref<FormInstance>();

const profileForm = reactive({
  displayName: '',
  email: '',
});

const profileRules: FormRules = {
  displayName: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
};

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

onMounted(async () => {
  loading.value = true;
  try {
    await userManageStore.fetchCurrentUser();
    if (userManageStore.currentUser) {
      profileForm.displayName = userManageStore.currentUser.displayName;
      profileForm.email = userManageStore.currentUser.email;
    }
  } finally {
    loading.value = false;
  }
});

const handleEditProfile = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  if (userManageStore.currentUser) {
    profileForm.displayName = userManageStore.currentUser.displayName;
    profileForm.email = userManageStore.currentUser.email;
  }
  isEditing.value = false;
};

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return;
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await userManageStore.updateProfile({
          displayName: profileForm.displayName,
          email: profileForm.email,
        });
        ElMessage.success('资料更新成功');
        isEditing.value = false;
      } catch (error) {
        ElMessage.error((error as Error).message || '更新失败');
      }
    }
  });
};
</script>

<template>
  <div class="profile-view">
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <div class="profile-content">
      <el-card class="info-card" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
            <template v-if="!isEditing">
              <el-button type="primary" :icon="Edit" @click="handleEditProfile">
                编辑资料
              </el-button>
            </template>
            <template v-else>
              <el-button :icon="Close" @click="handleCancelEdit">取消</el-button>
              <el-button type="success" :icon="Check" @click="handleSaveProfile">
                保存
              </el-button>
            </template>
          </div>
        </template>

        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100"
          :disabled="!isEditing"
        >
          <el-form-item label="用户名">
            <span class="info-value">
              {{ userManageStore.currentUser?.username || '-' }}
            </span>
          </el-form-item>
          <el-form-item label="姓名" prop="displayName">
            <el-input
              v-model="profileForm.displayName"
              placeholder="请输入姓名"
            />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="角色">
            <el-tag
              :type="getRoleTagType(userManageStore.currentUser?.role || '')"
              size="large"
            >
              {{ getRoleName(userManageStore.currentUser?.role || '') }}
            </el-tag>
          </el-form-item>
          <el-form-item label="创建时间">
            <span class="info-value">
              {{
                userManageStore.currentUser?.createdAt
                  ? new Date(
                      userManageStore.currentUser.createdAt
                    ).toLocaleString()
                  : '-'
              }}
            </span>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, oklch(98% 0.005 60) 0%, oklch(98% 0.008 250) 100%);
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
  position: relative;
}

.page-header::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: 2px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
  padding-left: 12px;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border: 1px solid oklch(90% 0.01 250);
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 3px oklch(0% 0 0 / 0.05), 0 4px 12px oklch(0% 0 0 / 0.05);
  transition: box-shadow 0.2s ease;
}

.info-card:hover {
  box-shadow: 0 4px 12px oklch(0% 0 0 / 0.08), 0 8px 24px oklch(0% 0 0 / 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.card-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: 2px;
}

.info-value {
  color: oklch(45% 0.05 250);
  font-weight: 500;
}

:deep(.el-form-item__label) {
  color: oklch(50% 0.03 250);
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--color-primary-light);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--color-primary-light) !important;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(40% 0.2 250 / 0.3);
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
  padding: 4px 12px;
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, var(--color-success) 0%, oklch(45% 0.15 160) 100%);
  border: none;
  border-radius: 8px;
}

:deep(.el-button--success:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(50% 0.15 160 / 0.3);
}
</style>
