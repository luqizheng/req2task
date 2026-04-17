<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataLine,
  Document,
  Ticket,
  Flag,
  Grid,
  User,
  Setting,
  Search,
  Bell,
  MagicStick,
  ArrowRight,
  ArrowLeft,
  ChatDotRound,
  Tools,
  MagicStick as AiIcon,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapsed = ref(false)
const passwordFormRef = ref()
const passwordDialogVisible = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordRules = {
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
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const userDisplayName = computed(() => {
  return userStore.userInfo?.displayName || userStore.userInfo?.username || '用户'
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch {}
}

const openChangePassword = () => {
  passwordDialogVisible.value = true
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate((valid: boolean) => {
    if (valid) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordDialogVisible.value = false
      userStore.logout()
      router.push('/login')
    }
  })
}

const menuItems = [
  { path: '/', icon: DataLine, label: '仪表盘', name: 'dashboard' },
  { path: '/projects', icon: Grid, label: '项目管理', name: 'projects' },
  { path: '/requirements', icon: Document, label: '需求管理', name: 'requirements' },
  { path: '/versions', icon: Ticket, label: '版本管理', name: 'versions' },
  { path: '/milestones', icon: Flag, label: '里程碑', name: 'milestones' },
  { path: '/ai/chat', icon: ChatDotRound, label: 'AI 对话', name: 'aiChat' },
  { path: '/ai/requirement-gen', icon: AiIcon, label: 'AI 需求生成', name: 'aiRequirementGen' },
  { path: '/ai/config', icon: Tools, label: 'AI 配置', name: 'aiConfig' },
  { path: '/users', icon: User, label: '用户管理', name: 'users' },
]

const bottomMenuItems = [
  { path: '/settings', icon: Setting, label: '系统设置', name: 'settings' },
]
</script>

<template>
  <div class="layout-container" :class="{ collapsed: isCollapsed }">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="24" class="logo-icon"><MagicStick /></el-icon>
          <span v-show="!isCollapsed" class="logo-text">req2task</span>
        </div>
      </div>

      <el-menu
        :default-active="route.path"
        class="sidebar-menu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        :router="true"
      >
        <template v-for="item in menuItems" :key="item.name">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.label }}</template>
          </el-menu-item>
        </template>
        
        <div class="menu-divider" v-if="!isCollapsed"></div>
        
        <template v-for="item in bottomMenuItems" :key="item.name">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.label }}</template>
          </el-menu-item>
        </template>
      </el-menu>

      <div class="sidebar-footer">
        <el-button 
          :icon="isCollapsed ? ArrowRight : ArrowLeft" 
          text 
          class="collapse-btn"
          @click="isCollapsed = !isCollapsed"
        >
          <span v-if="!isCollapsed">收起</span>
        </el-button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-left">
          <div class="global-search">
            <el-input
              placeholder="全局搜索需求、用户故事..."
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
          </div>
        </div>
        
        <div class="header-right">
          <el-badge :value="3" :max="99" class="notification-badge">
            <el-button :icon="Bell" circle text />
          </el-badge>
          
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39593f0349b2ea8d72896280.jpeg" />
              <span class="user-name">{{ userDisplayName }}</span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item @click="openChangePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="main-content">
        <slot />
      </main>
    </div>

    <div class="ai-assistant">
      <el-tooltip content="AI 智能助手" placement="left">
        <el-button
          type="primary"
          circle
          size="large"
          class="ai-btn"
          @click="router.push('/ai/chat')"
        >
          <el-icon :size="24"><MagicStick /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background: #f1f5f9;
}

.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 100;
}

.layout-container.collapsed .sidebar {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.logo-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  margin: 4px 8px;
  border-radius: 8px;
  color: #64748b;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #eff6ff;
  color: #2563eb;
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #2563eb;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: #f8fafc;
}

.menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 16px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.sidebar-footer .collapse-btn {
  width: 100%;
  justify-content: center;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  flex: 1;
  max-width: 480px;
}

.global-search {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: #f1f5f9;
  box-shadow: none;
}

.search-input :deep(.el-input__wrapper:focus-within) {
  box-shadow: 0 0 0 2px #2563eb40;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge :deep(.el-badge__content) {
  background: #ef4444;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f1f5f9;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.arrow {
  color: #94a3b8;
  transform: rotate(90deg);
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 0;
}

.ai-assistant {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.ai-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}
</style>