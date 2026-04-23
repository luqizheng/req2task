<script setup lang="ts">
import { useRoute } from 'vue-router';
import { MagicStick, ArrowRight, ArrowLeft } from '@element-plus/icons-vue';
import type { MenuItem } from '@/composables/useLayout';

defineProps<{
  isCollapsed: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const route = useRoute();

const menuItems: MenuItem[] = [
  { path: '/', name: 'dashboard', label: '仪表盘', icon: 'DataLine' },
  { path: '/projects', name: 'projects', label: '项目管理', icon: 'Grid' },
  { path: '/requirements', name: 'requirements', label: '需求管理', icon: 'Document' },
  { path: '/versions', name: 'versions', label: '版本管理', icon: 'Ticket' },
  { path: '/milestones', name: 'milestones', label: '里程碑', icon: 'Flag' },
  { path: '/ai/chat', name: 'aiChat', label: 'AI 对话', icon: 'ChatDotRound' },
  { path: '/ai/requirement-gen', name: 'aiRequirementGen', label: 'AI 需求生成', icon: 'MagicStick' },
  { path: '/ai/config', name: 'aiConfig', label: 'AI 配置', icon: 'Tools' },
  { path: '/users', name: 'users', label: '用户管理', icon: 'User' },
];

const bottomMenuItems: MenuItem[] = [
  { path: '/settings', name: 'settings', label: '系统设置', icon: 'Setting' },
];
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
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
        @click="emit('toggle')"
      >
        <span v-if="!isCollapsed">收起</span>
      </el-button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, white 0%, oklch(99% 0.005 250) 100%);
  border-right: 1px solid oklch(88% 0.015 250);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  z-index: 100;
  box-shadow: 2px 0 12px oklch(0% 0 0 / 0.03);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid oklch(90% 0.02 250);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.logo-icon {
  color: white;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px oklch(0% 0 0 / 0.2));
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 2px 4px oklch(0% 0 0 / 0.2));
  }
  50% {
    filter: drop-shadow(0 2px 8px oklch(40% 0.2 250 / 0.4));
  }
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  text-shadow: 0 1px 2px oklch(0% 0 0 / 0.1);
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 44px;
  margin: 4px 8px;
  border-radius: 10px;
  color: oklch(50% 0.03 250);
  transition: all 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  transition: color 0.2s ease;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, oklch(96% 0.03 250) 0%, oklch(93% 0.05 250) 100%);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 2px 8px oklch(40% 0.15 250 / 0.15);
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--color-primary);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: oklch(96% 0.01 250);
  color: var(--color-primary-light);
  transform: translateX(2px);
}

.menu-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, oklch(88% 0.02 250) 20%, oklch(88% 0.02 250) 80%, transparent 100%);
  margin: 12px 16px;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid oklch(90% 0.02 250);
  background: oklch(99% 0.005 60);
}

.sidebar-footer .collapse-btn {
  width: 100%;
  justify-content: center;
  color: oklch(50% 0.03 250);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar-footer .collapse-btn:hover {
  background: oklch(95% 0.02 250);
  color: var(--color-primary);
}
</style>
