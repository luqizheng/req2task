<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { projectsApi, type ProjectProgressDto } from '@/api/projects';
import { ElMessage } from 'element-plus';
import BurndownChart from '@/components/project/BurndownChart.vue';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string);
const loading = ref(false);
const progressData = ref<ProjectProgressDto | null>(null);

const taskStatusMap: Record<string, { label: string; type: string }> = {
  TODO: { label: '待办', type: 'info' },
  IN_PROGRESS: { label: '进行中', type: 'primary' },
  IN_REVIEW: { label: '审核中', type: 'warning' },
  DONE: { label: '已完成', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};

const taskStatusList = computed(() => {
  if (!progressData.value) return [];
  return Object.entries(progressData.value.byTaskStatus).map(([status, count]) => ({
    status,
    ...taskStatusMap[status] || { label: status, type: 'info' },
    count,
  }));
});

const fetchProgress = async () => {
  loading.value = true;
  try {
    const res = await projectsApi.getProgress(projectId.value);
    progressData.value = res.data;
  } catch (error) {
    ElMessage.error('获取项目进度失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProgress();
});
</script>

<template>
  <div class="project-progress" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.push(`/projects/${projectId}`)">返回</el-button>
      <h2 class="page-title">项目进度</h2>
      <el-button @click="fetchProgress" :loading="loading">刷新</el-button>
    </div>

    <template v-if="progressData">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-card class="overall-card">
            <template #header>
              <span class="card-title">整体进度</span>
            </template>
            <div class="overall-progress">
              <el-progress
                type="circle"
                :percentage="progressData.taskProgress"
                :width="180"
                :color="getProgressColor(progressData.taskProgress)"
              />
              <div class="progress-details">
                <p>需求完成: {{ progressData.completedRequirements }} / {{ progressData.totalRequirements }}</p>
                <p>任务完成: {{ progressData.completedTasks }} / {{ progressData.totalTasks }}</p>
                <p>故事点: {{ progressData.completedStoryPoints }} / {{ progressData.totalStoryPoints }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="module-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="card-title">需求统计</span>
            </template>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">总需求</span>
                <span class="stat-value">{{ progressData.totalRequirements }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value success">{{ progressData.completedRequirements }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">需求进度</span>
                <el-progress
                  :percentage="progressData.requirementProgress"
                  :stroke-width="12"
                  :color="getProgressColor(progressData.requirementProgress)"
                />
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="card-title">任务分布</span>
            </template>
            <div class="task-distribution">
              <div
                v-for="item in taskStatusList"
                :key="item.status"
                class="stat-item"
              >
                <el-tag :type="item.type as any">{{ item.label }}</el-tag>
                <span class="stat-value">{{ item.count }}</span>
              </div>
            </div>
            <el-progress
              type="dashboard"
              :percentage="progressData.taskProgress"
              :width="150"
              color="#22c55e"
            />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="card-title">工时统计</span>
            </template>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">预估工时</span>
                <span class="stat-value">{{ progressData.totalEstimatedHours }}h</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">实际工时</span>
                <span class="stat-value">{{ progressData.totalActualHours }}h</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="card-title">燃尽图（近14天）</span>
            </template>
            <BurndownChart :data="progressData.burndownData" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <el-empty v-else description="暂无数据" />
  </div>
</template>

<style scoped>
.project-progress {
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

.overall-card {
  margin-bottom: 24px;
}

.overall-progress {
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 24px 0;
}

.progress-details {
  font-size: 16px;
  color: #64748b;
  line-height: 2;
}

.module-row {
  margin-bottom: 24px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  color: #64748b;
  min-width: 80px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.stat-value.success {
  color: #22c55e;
}

.task-distribution {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

</style>
