<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Delete, ArrowLeft, Edit } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import { ProjectStatus } from '@req2task/dto';
import type { UpdateProjectDto } from '@req2task/dto';
import ProjectStatsCard from './components/ProjectStatsCard.vue';
import ProjectQuickActions from './components/ProjectQuickActions.vue';
import ProjectMemberCard from './components/ProjectMemberCard.vue';
import ProjectTaskBoard from './components/ProjectTaskBoard.vue';
import ModuleTree from '@/components/common/ModuleTree.vue';
import type { FeatureModuleResponseDto } from '@req2task/dto';

type ViewMode = 'admin' | 'developer' | 'tester' | 'product';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const loading = ref(false);
const viewMode = ref<ViewMode>('admin');

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive({
  name: '',
  description: '',
  status: ProjectStatus.ACTIVE,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
};

const statusOptions = [
  { value: ProjectStatus.ACTIVE, label: '进行中', color: '#10b981' },
  { value: ProjectStatus.PLANNING, label: '规划中', color: '#f59e0b' },
  { value: ProjectStatus.COMPLETED, label: '已完成', color: '#3b82f6' },
  { value: ProjectStatus.ARCHIVED, label: '已归档', color: '#94a3b8' },
];

const getStatusStyle = (status: string) => {
  const option = statusOptions.find(s => s.value === status);
  return {
    color: option?.color || '#94a3b8',
    background: `${option?.color}15` || '#f1f5f9',
  };
};

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status;
};

const handleEditProject = () => {
  if (!projectStore.currentProject) return;
  formData.name = projectStore.currentProject.name;
  formData.description = projectStore.currentProject.description || '';
  formData.status = projectStore.currentProject.status || ProjectStatus.ACTIVE;
  dialogVisible.value = true;
};

const handleSubmitEdit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (valid) {
      handleUpdateProject({
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      dialogVisible.value = false;
    }
  });
};

const requirementCount = ref(0);
const taskCount = ref(0);
const completedTaskCount = ref(0);

const projectId = computed(() => route.params.id as string);

const viewModes = [
  { key: 'admin' as ViewMode, label: '项目总览', icon: 'Grid' },
  { key: 'developer' as ViewMode, label: '开发视图', icon: 'Code' },
  { key: 'tester' as ViewMode, label: '测试视图', icon: 'Finished' },
  { key: 'product' as ViewMode, label: '产品视图', icon: 'Goods' },
];

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
    requirementCount.value = res?.total || 0;
  } catch {
    requirementCount.value = 0;
  }
};

const handleDeleteProject = async () => {
  try {
    await ElMessageBox.confirm(
      '确定删除此项目吗？此操作不可恢复。',
      '危险操作',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error' }
    );
    await projectStore.deleteProject(projectId.value);
    ElMessage.success('项目已删除');
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
    ElMessage.success('项目信息已更新');
    loadProject();
  } catch (error) {
    ElMessage.error((error as Error).message || '更新失败');
  }
};

const handleAddMember = async (userId: string) => {
  try {
    await projectStore.addMember(projectId.value, { userId });
    ElMessage.success('成员已添加');
    loadProject();
  } catch (error) {
    ElMessage.error((error as Error).message || '添加失败');
  }
};

const handleRemoveMember = async (userId: string) => {
  try {
    await projectStore.removeMember(projectId.value, userId);
    ElMessage.success('成员已移除');
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
  <div class="project-detail-view">
    <header class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          text
          @click="router.push('/projects')"
          class="back-btn"
        >
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">{{ projectStore.currentProject?.name || '项目详情' }}</h1>
          <div class="project-meta">
            <el-tag
              v-if="projectStore.currentProject?.projectKey"
              size="small"
              effect="plain"
              class="project-key"
            >
              {{ projectStore.currentProject.projectKey }}
            </el-tag>
            <span
              class="project-status"
              :style="getStatusStyle(projectStore.currentProject?.status || '')"
            >
              {{ getStatusLabel(projectStore.currentProject?.status || '') }}
            </span>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="view-mode-switcher">
          <button
            v-for="mode in viewModes"
            :key="mode.key"
            :class="['view-mode-btn', { active: viewMode === mode.key }]"
            @click="viewMode = mode.key"
          >
            <el-icon><component :is="mode.icon" /></el-icon>
            <span>{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <div class="header-right">
        <el-button :icon="Edit" @click="handleEditProject" class="edit-btn">
          编辑
        </el-button>
        <el-dropdown trigger="click">
          <el-button type="danger" plain>
            <el-icon><Delete /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleDeleteProject">
                删除项目
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-content">
      <ProjectStatsCard
        :project="projectStore.currentProject"
        :requirement-count="requirementCount"
        :task-count="taskCount"
        :completed-task-count="completedTaskCount"
        :view-mode="viewMode"
      />

      <div class="content-grid" :class="`view-${viewMode}`">
        <div class="main-area">
          <ProjectTaskBoard
            v-if="viewMode === 'developer' || viewMode === 'admin'"
            :project-id="projectId"
          />

          <el-card
            v-if="viewMode === 'tester'"
            class="tester-view-card"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">待验证需求</span>
              </div>
            </template>
            <div class="empty-state">
              <el-icon size="48"><Finished /></el-icon>
              <p>暂无待验证的需求</p>
            </div>
          </el-card>

          <el-card
            v-if="viewMode === 'product'"
            class="product-view-card"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">需求列表</span>
                <el-button type="primary" size="small">
                  新建需求
                </el-button>
              </div>
            </template>
            <div class="empty-state">
              <el-icon size="48"><Goods /></el-icon>
              <p>暂无需求，试试 AI 生成</p>
              <el-button type="primary">AI 生成需求</el-button>
            </div>
          </el-card>
        </div>

        <aside class="sidebar">
          <ProjectQuickActions :project-id="projectId" :view-mode="viewMode" />

          <ProjectMemberCard
            v-if="viewMode === 'admin'"
            :project="projectStore.currentProject"
            :loading="loading"
            @add-member="handleAddMember"
            @remove-member="handleRemoveMember"
          />

          <el-card class="module-section" v-if="viewMode !== 'admin'">
            <template #header>
              <div class="section-header">
                <span class="section-title">功能模块</span>
              </div>
            </template>
            <ModuleTree
              :project-id="projectId"
              @node-click="handleModuleClick"
            />
          </el-card>
        </aside>
      </div>

      <el-card
        v-if="viewMode === 'admin'"
        class="module-section admin-modules"
      >
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
    </main>

    <el-dialog v-model="dialogVisible" title="编辑项目" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.project-detail-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 24px 32px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px;
  font-size: 14px;
  color: #64748b;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #2563eb;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.02em;
}

.project-key {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.project-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.header-center {
  display: flex;
  justify-content: center;
}

.view-mode-switcher {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-mode-btn:hover {
  color: #1e293b;
  background: white;
}

.view-mode-btn.active {
  background: white;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.header-right {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.edit-btn {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #64748b;
}

.edit-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.main-content {
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-top: 24px;
}

.content-grid.view-developer,
.content-grid.view-tester {
  grid-template-columns: 1fr 360px;
}

.content-grid.view-product {
  grid-template-columns: 1fr 400px;
}

.main-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.module-section {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.section-hint {
  font-size: 12px;
  color: #94a3b8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #94a3b8;
  text-align: center;
}

.empty-state .el-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.admin-modules {
  margin-top: 24px;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-grid.view-developer,
  .content-grid.view-tester,
  .content-grid.view-product {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .view-mode-switcher {
    overflow-x: auto;
    width: 100%;
    justify-content: flex-start;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
