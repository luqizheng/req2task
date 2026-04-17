<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { projectsApi, type BaselineDto } from '@/api/projects';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const projectId = ref(route.params.id as string);
const loading = ref(false);
const baselines = ref<BaselineDto[]>([]);

const dialogVisible = ref(false);
const createForm = ref({ name: '', description: '' });
const createLoading = ref(false);

const fetchBaselines = async () => {
  loading.value = true;
  try {
    const res = await projectsApi.getBaselines(projectId.value);
    baselines.value = res.data;
  } catch (error) {
    ElMessage.error('获取基线列表失败');
  } finally {
    loading.value = false;
  }
};

const handleCreateBaseline = async () => {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入基线名称');
    return;
  }
  createLoading.value = true;
  try {
    await projectsApi.createBaseline(projectId.value, createForm.value);
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    createForm.value = { name: '', description: '' };
    fetchBaselines();
  } catch (error) {
    ElMessage.error('创建失败');
  } finally {
    createLoading.value = false;
  }
};

const handleRestoreBaseline = async (baseline: BaselineDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复基线 "${baseline.name}" 吗？这将覆盖当前项目状态。`,
      '恢复确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await projectsApi.restoreBaseline(baseline.id);
    ElMessage.success('基线恢复成功');
    router.push(`/projects/${projectId.value}`);
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('恢复失败');
    }
  }
};

const handleDeleteBaseline = async (baseline: BaselineDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除基线 "${baseline.name}" 吗？`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await projectsApi.deleteBaseline(baseline.id);
    ElMessage.success('删除成功');
    fetchBaselines();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const getSnapshotCount = (baseline: BaselineDto) => {
  const reqs = baseline.snapshotData?.requirements?.length || 0;
  const tasks = baseline.snapshotData?.tasks?.length || 0;
  const modules = baseline.snapshotData?.modules?.length || 0;
  return { reqs, tasks, modules };
};

onMounted(() => {
  fetchBaselines();
});
</script>

<template>
  <div class="baseline-manage" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.push(`/projects/${projectId}`)">返回</el-button>
      <h2 class="page-title">基线管理</h2>
      <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
        创建基线
      </el-button>
    </div>

    <el-card>
      <template #header>
        <span class="card-title">基线列表</span>
      </template>

      <el-table :data="baselines" stripe v-loading="loading">
        <el-table-column prop="name" label="基线名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="150">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdBy.name" label="创建人" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="快照概览" min-width="220">
          <template #default="{ row }">
            <div class="snapshot-info">
              <el-tag size="small" type="info">
                模块: {{ getSnapshotCount(row).modules }}
              </el-tag>
              <el-tag size="small" type="info">
                需求: {{ getSnapshotCount(row).reqs }}
              </el-tag>
              <el-tag size="small" type="info">
                任务: {{ getSnapshotCount(row).tasks }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleRestoreBaseline(row)">
              恢复
            </el-button>
            <el-button type="danger" link size="small" @click="handleDeleteBaseline(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!baselines.length && !loading" description="暂无基线" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="创建基线" width="500px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="基线名称" required>
          <el-input v-model="createForm.name" placeholder="请输入基线名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入基线描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateBaseline">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.baseline-manage {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.snapshot-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
