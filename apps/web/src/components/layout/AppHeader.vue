<script setup lang="ts">
import { Search, Bell } from '@element-plus/icons-vue';

defineProps<{
  notificationCount?: number;
}>();
</script>

<template>
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
      <el-badge :value="notificationCount" :max="99" class="notification-badge">
        <el-button :icon="Bell" circle text />
      </el-badge>
      
      <slot name="user-area" />
    </div>
  </header>
</template>

<style scoped>
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
</style>
