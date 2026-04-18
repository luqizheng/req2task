<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
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
</script>

<template>
  <el-card class="member-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="card-title">成员管理</span>
        <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">
          添加成员
        </el-button>
      </div>
    </template>
    <div class="member-list">
      <div v-if="!project?.members?.length" class="empty-tip">
        暂无成员
      </div>
      <div v-for="member in project?.members" :key="member.id" class="member-item">
        <el-avatar size="small">{{ member.displayName?.charAt(0) || '?' }}</el-avatar>
        <div class="member-info">
          <div class="member-name">{{ member.displayName }}</div>
          <div class="member-email">{{ member.email }}</div>
        </div>
        <el-button
          type="danger"
          link
          size="small"
          @click="handleRemoveMember(member.id, member.displayName || '')"
        >
          移除
        </el-button>
      </div>
    </div>
  </el-card>

  <el-dialog v-model="dialogVisible" title="添加成员" width="500px" destroy-on-close>
    <el-input v-model="search" placeholder="搜索成员" clearable style="margin-bottom: 16px" />
    <div class="available-members" v-loading="memberLoading">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="member-item"
      >
        <el-avatar size="small">{{ user.displayName?.charAt(0) || '?' }}</el-avatar>
        <div class="member-info">
          <div class="member-name">{{ user.displayName }}</div>
        </div>
        <el-button type="primary" size="small" @click="handleAddMember(user.id)">
          添加
        </el-button>
      </div>
      <div v-if="!availableUsers.length" class="empty-tip">暂无可添加的成员</div>
      <div v-else-if="!filteredUsers.length" class="empty-tip">无匹配结果</div>
    </div>
  </el-dialog>
</template>

<style scoped>
.member-card {
  min-height: 200px;
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
  max-height: 300px;
  overflow-y: auto;
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
  min-width: 0;
}

.member-name {
  font-weight: 500;
  color: #1e293b;
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

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
}
</style>
