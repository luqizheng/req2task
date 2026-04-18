<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, UserFilled, Search } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import type { ProjectResponseDto, PublicUserDto } from '@req2task/dto';
import { useUserManageStore } from '@/stores/userManage';

interface Props {
  project: ProjectResponseDto | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  addMember: [userId: string];
  removeMember: [userId: string];
}>();

const userManageStore = useUserManageStore();
const dialogVisible = ref(false);
const search = ref('');
const memberLoading = ref(false);
const availableUsers = ref<PublicUserDto[]>([]);

const loadAvailableUsers = async () => {
  memberLoading.value = true;
  try {
    await userManageStore.fetchPublicUserList({ limit: 100 });
    availableUsers.value = userManageStore.publicUserList;
  } finally {
    memberLoading.value = false;
  }
};

const openAddDialog = async () => {
  search.value = '';
  await loadAvailableUsers();
  dialogVisible.value = true;
};

const handleAddMember = (userId: string) => {
  emit('addMember', userId);
};

const handleRemoveMember = (userId: string, displayName: string) => {
  ElMessageBox.confirm(`确定移除成员 "${displayName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      emit('removeMember', userId);
    })
    .catch(() => {});
};

const filteredUsers = computed(() => {
  return availableUsers.value.filter(
    u =>
      !props.project?.members?.some(m => m.id === u.id) &&
      u.displayName.includes(search.value)
  );
});

const getAvatarColor = (name: string) => {
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#ec4899', '#6366f1'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
</script>

<template>
  <div class="member-card-container" v-loading="loading">
    <header class="card-header">
      <div class="header-left">
        <el-icon class="header-icon"><UserFilled /></el-icon>
        <h3 class="card-title">成员管理</h3>
        <span class="member-count">{{ project?.members?.length || 0 }} 人</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog" size="small">
        添加
      </el-button>
    </header>

    <div class="member-list">
      <TransitionGroup name="member-list" tag="div" class="member-list-inner">
        <div
          v-for="member in project?.members"
          :key="member.id"
          class="member-item"
        >
          <div class="member-avatar" :style="{ background: getAvatarColor(member.displayName || '') }">
            {{ member.displayName?.charAt(0) || '?' }}
          </div>
          <div class="member-info">
            <span class="member-name">{{ member.displayName }}</span>
            <span class="member-email">{{ member.email }}</span>
          </div>
          <el-button
            type="danger"
            link
            size="small"
            class="remove-btn"
            @click="handleRemoveMember(member.id, member.displayName || '')"
          >
            移除
          </el-button>
        </div>
      </TransitionGroup>

      <div v-if="!project?.members?.length" class="empty-state">
        <div class="empty-icon"><UserFilled /></div>
        <p class="empty-text">暂无成员</p>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" title="添加成员" width="500px" destroy-on-close>
    <div class="dialog-search">
      <el-input
        v-model="search"
        placeholder="搜索成员..."
        clearable
        size="large"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="available-members" v-loading="memberLoading">
      <TransitionGroup name="member-list" tag="div" class="member-list-inner">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="member-item"
        >
          <div class="member-avatar" :style="{ background: getAvatarColor(user.displayName || '') }">
            {{ user.displayName?.charAt(0) || '?' }}
          </div>
          <div class="member-info">
            <span class="member-name">{{ user.displayName }}</span>
            <span class="member-email">{{ user.email }}</span>
          </div>
          <el-button type="primary" size="small" @click="handleAddMember(user.id)">
            添加
          </el-button>
        </div>
      </TransitionGroup>

      <div v-if="!availableUsers.length" class="empty-state">
        <p class="empty-text">暂无可添加的成员</p>
      </div>
      <div v-else-if="!filteredUsers.length" class="empty-state">
        <p class="empty-text">无匹配结果</p>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.member-card-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
  color: #2563eb;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.member-count {
  font-size: 13px;
  color: #64748b;
  padding: 2px 10px;
  background: #f1f5f9;
  border-radius: 12px;
}

.member-list {
  max-height: 320px;
  overflow-y: auto;
}

.member-list-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.25s;
  border: 1px solid transparent;
}

.member-item:hover {
  background: white;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.member-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-email {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.member-item:hover .remove-btn {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-text {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.dialog-search {
  margin-bottom: 20px;
}

.available-members {
  max-height: 400px;
  overflow-y: auto;
}

.member-list-enter-active,
.member-list-leave-active {
  transition: all 0.3s ease;
}

.member-list-enter-from,
.member-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (max-width: 768px) {
  .member-card-container {
    padding: 16px;
  }

  .card-header {
    margin-bottom: 16px;
  }

  .member-list {
    max-height: 280px;
  }

  .member-item {
    padding: 10px;
    gap: 10px;
  }

  .member-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .remove-btn {
    opacity: 1;
  }
}
</style>
