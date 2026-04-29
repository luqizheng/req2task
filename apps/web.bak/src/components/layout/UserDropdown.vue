<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue';

defineProps<{
  displayName: string;
}>();

const emit = defineEmits<{
  (e: 'openPassword'): void;
  (e: 'logout'): void;
}>();

const router = useRouter();
</script>

<template>
  <el-dropdown trigger="click">
    <div class="user-info">
      <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39593f0349b2ea8d72896280.jpeg" />
      <span class="user-name">{{ displayName }}</span>
      <el-icon class="arrow"><ArrowRight /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
        <el-dropdown-item @click="emit('openPassword')">修改密码</el-dropdown-item>
        <el-dropdown-item divided @click="emit('logout')">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
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
</style>
