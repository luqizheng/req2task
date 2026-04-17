<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();

const projectId = ref(route.params.id as string);
const loading = ref(false);

interface Baseline {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  snapshot: {
    requirements: number;
    userStories: number;
    tasks: number;
  };
}

const baselines = ref<Baseline[]>([
  {
    id: '1',
    name: 'v1.0 基线',
    createdBy: '管理员',
    createdAt: '2024-03-15 10:30:00',
    snapshot: { requirements: 10, userStories: 25, tasks: 50 },
  },
  {
    id: '2',
    name: 'v1.1 基线',
    createdBy: '管理员',
    createdAt: '2024-04-01 14:20:00',
    snapshot: { requirements: 15, userStories: 35, tasks: 70 },
  },
]);

const handleCreateBaseline = async () => {
  ElMessage.info('创建基线功能开发中');
};

const handleRestoreBaseline = async (baseline: Baseline) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复基线 "${baseline.name}" 吗？`,
      '恢复确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    ElMessage.success('基线恢复功能开发中');
  } catch {}
};

const handleDeleteBaseline = async (baseline: Baseline) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除基线 "${baseline.name}" 吗？`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    ElMessage.success('基线删除功能开发中');
  } catch {}
};
</script>

<template>
  <div class="baseline-manage" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.push(`/projects/${projectId}`)">返回</el-button>
      <h2 class="page-title">基线管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreateBaseline">
        创建基线
      </el-button>
    </div>

    <el-card>
      <template #header>
        <span class="card-title">基线列表</span>
      </template>

      <el-table :data="baselines" stripe>
        <el-table-column prop="name" label="基线名称" min-width="150" />
        <el-table-column prop="createdBy" label="创建人" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="快照概览" min-width="200">
          <template #default="{ row }">
            <div class="snapshot-info">
              <el-tag size="small" type="info">
                需求: {{ row.snapshot.requirements }}
              </el-tag>
              <el-tag size="small" type="info">
                故事: {{ row.snapshot.userStories }}
              </el-tag>
              <el-tag size="small" type="info">
                任务: {{ row.snapshot.tasks }}
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

      <el-empty v-if="!baselines.length" description="暂无基线" />
    </el-card>
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
}
</style>
