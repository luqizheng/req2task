<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import type { UpdateProjectDto } from '@req2task/dto';
import ProjectStatsCard from './components/ProjectStatsCard.vue';
import ProjectQuickActions from './components/ProjectQuickActions.vue';
import ProjectInfoCard from './components/ProjectInfoCard.vue';
import ProjectMemberCard from './components/ProjectMemberCard.vue';
import ProjectTaskBoard from './components/ProjectTaskBoard.vue';
import ModuleTree from '@/components/common/ModuleTree.vue';
import type { FeatureModuleResponseDto } from '@req2task/dto';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const loading = ref(false);

const requirementCount = ref(0);
const taskCount = ref(0);
const completedTaskCount = ref(0);

const projectId = computed(() => route.params.id as string);

const loadProject = async () => {
  loading.value = true;
  try {
    await projectStore.fetchProjectById(projectId.value);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const { requirementsApi } = await import('@/api/requirements');
    const res = await requirementsApi.getListByProject(projectId.value, { limit: 1 });
    requirementCount.value = res.data?.data?.total || 0;
  } catch {
    requirementCount.value = 0;
  }
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

const handleUpdateProject = async (data: UpdateProjectDto) => {
  try {
    await projectStore.updateProject(projectId.value, data);
    ElMessage.success('更新成功');
    loadProject();
  } catch (error) {
    ElMessage.error((error as Error).message || '更新失败');
  }
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
    await projectStore.removeMember(projectId.value, userId);
    ElMessage.success('移除成功');
    loadProject();
  } catch (error) {
    ElMessage.error((error as Error).message || '移除失败');
  }
};

const handleModuleClick = (module: FeatureModuleResponseDto) => {
  router.push(`/projects/${projectId.value}/modules/${module.id}/requirements`);
};

onMounted(async () => {
  await loadProject();
  await loadStats();
});
</script>

<template>
  <div class="project-detail">
    <div class="page-header">
      <el-button @click="router.push('/projects')">返回</el-button>
      <h2 class="page-title">{{ projectStore.currentProject?.name || '项目详情' }}</h2>
      <div class="header-actions">
        <el-button type="danger" :icon="Delete" @click="handleDeleteProject">删除</el-button>
      </div>
    </div>

    <div class="detail-content">
      <ProjectStatsCard
        :project="projectStore.currentProject"
        :requirement-count="requirementCount"
        :task-count="taskCount"
        :completed-task-count="completedTaskCount"
      />

      <ProjectTaskBoard :project-id="projectId" />

      <ProjectQuickActions :project-id="projectId" />

      <el-row :gutter="16">
        <el-col :span="16">
          <ProjectInfoCard
            :project="projectStore.currentProject"
            :loading="loading"
            @update="handleUpdateProject"
          />
        </el-col>
        <el-col :span="8">
          <ProjectMemberCard
            :project="projectStore.currentProject"
            :loading="loading"
            @add-member="handleAddMember"
            @remove-member="handleRemoveMember"
          />
        </el-col>
      </el-row>

      <el-card class="module-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">功能模块</span>
            <span class="section-hint">点击模块查看详情</span>
          </div>
        </template>
        <ModuleTree
          :project-id="projectId"
          @node-click="handleModuleClick"
        />
      </el-card>
    </div>
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

.module-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.section-hint {
  font-size: 12px;
  color: #909399;
}
</style>
