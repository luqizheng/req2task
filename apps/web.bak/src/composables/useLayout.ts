import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

export interface MenuItem {
  path: string;
  name: string;
  label: string;
  icon?: unknown;
}

export function useLayout() {
  const router = useRouter();
  const userStore = useUserStore();

  const isCollapsed = ref(false);
  const passwordDialogVisible = ref(false);
  const passwordFormRef = ref<FormInstance>();
  const passwordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const userDisplayName = computed(() => {
    return userStore.userInfo?.displayName || userStore.userInfo?.username || '用户';
  });

  const passwordRules: FormRules = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码至少6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (value !== passwordForm.value.newPassword) {
            callback(new Error('两次密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ]
  };

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
  };

  const openPasswordDialog = () => {
    passwordDialogVisible.value = true;
  };

  const handleLogout = async () => {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      userStore.logout();
      router.push('/login');
    } catch {}
  };

  const handleChangePassword = async () => {
    if (!passwordFormRef.value) return;
    await passwordFormRef.value.validate((valid: boolean) => {
      if (valid) {
        ElMessage.success('密码修改成功，请重新登录');
        passwordDialogVisible.value = false;
        userStore.logout();
        router.push('/login');
      }
    });
  };

  const resetPasswordForm = () => {
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    passwordFormRef.value?.resetFields();
  };

  return {
    isCollapsed,
    passwordDialogVisible,
    passwordFormRef,
    passwordForm,
    passwordRules,
    userDisplayName,
    toggleSidebar,
    openPasswordDialog,
    handleLogout,
    handleChangePassword,
    resetPasswordForm
  };
}
