<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import { featureModulesApi } from '@/api/featureModules';
import type { FeatureModuleResponseDto, UpdateProjectDto } from '@req2task/dto';
import ProjectStatsCard from '@/components/project/ProjectStatsCard.vue';
import ProjectQuickActions from '@/components/project/ProjectQuickActions.vue';
import ProjectInfoCard from '@/components/project/ProjectInfoCard.vue';
import ProjectMemberCard from '@/components/project/ProjectMemberCard.vue';
import ProjectModuleCard from '@/components/project/ProjectModuleCard.vue';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const loading = ref(false);
const modules = ref<FeatureModuleResponseDto[]>([]);
const moduleLoading = ref(false);

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

const loadModules = async () => {
  moduleLoading.value = true;
  try {
    const data = await featureModulesApi.getList(projectId.value);
    modules.value = data.items;
  } finally {
    moduleLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    const { requirementsApi } = await import('@/api/requirements');
    let totalReq = 0;
    for (const mod of modules.value) {
      const result = await requirementsApi.getListByModule(mod.id, { limit: 1 });
      totalReq += result.total;
    }
    requirementCount.value = totalReq;
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

const handleReloadModules = () => {
  loadModules();
};

onMounted(async () => {
  await loadProject();
  await loadModules();
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

      <ProjectModuleCard
        :modules="modules"
        :loading="moduleLoading"
        :project-id="projectId"
        @reload="handleReloadModules"
      />
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
</style>
