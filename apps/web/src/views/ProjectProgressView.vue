<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.id as string);
const loading = ref(false);

const projectProgress = computed(() => {
  return {
    overall: 65,
    modules: [
      { name: '用户管理', total: 8, completed: 6 },
      { name: '项目管理', total: 5, completed: 3 },
      { name: '需求管理', total: 12, completed: 8 },
      { name: '任务管理', total: 15, completed: 9 },
    ],
    requirements: {
      total: 30,
      completed: 18,
      inProgress: 8,
      pending: 4,
    },
    tasks: {
      total: 100,
      todo: 20,
      inProgress: 30,
      done: 50,
    },
  };
});

const getPercentage = (completed: number, total: number) => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 50) return '#f59e0b';
  return '#ef4444';
};
</script>

<template>
  <div class="project-progress" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.push(`/projects/${projectId}`)">返回</el-button>
      <h2 class="page-title">项目进度</h2>
    </div>

    <el-row :gutter="24">
      <el-col :span="24">
        <el-card class="overall-card">
          <template #header>
            <span class="card-title">整体进度</span>
          </template>
          <div class="overall-progress">
            <el-progress
              type="circle"
              :percentage="projectProgress.overall"
              :width="180"
              :color="getProgressColor(projectProgress.overall)"
            />
            <div class="progress-details">
              <p>已完成: {{ projectProgress.requirements.completed }} / {{ projectProgress.requirements.total }} 需求</p>
              <p>已完成: {{ projectProgress.tasks.done }} / {{ projectProgress.tasks.total }} 任务</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="module-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">模块进度</span>
          </template>
          <div class="module-list">
            <div v-for="module in projectProgress.modules" :key="module.name" class="module-item">
              <div class="module-header">
                <span class="module-name">{{ module.name }}</span>
                <span class="module-stats">{{ module.completed }}/{{ module.total }}</span>
              </div>
              <el-progress
                :percentage="getPercentage(module.completed, module.total)"
                :stroke-width="8"
                :color="getProgressColor(getPercentage(module.completed, module.total))"
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
            <div class="stat-item">
              <el-tag type="info">待办</el-tag>
              <span class="stat-value">{{ projectProgress.tasks.todo }}</span>
            </div>
            <div class="stat-item">
              <el-tag type="primary">进行中</el-tag>
              <span class="stat-value">{{ projectProgress.tasks.inProgress }}</span>
            </div>
            <div class="stat-item">
              <el-tag type="success">已完成</el-tag>
              <span class="stat-value">{{ projectProgress.tasks.done }}</span>
            </div>
          </div>
          <el-progress
            type="dashboard"
            :percentage="projectProgress.tasks.done"
            :width="150"
            color="#22c55e"
          />
        </el-card>
      </el-col>
    </el-row>
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

.module-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.module-name {
  font-weight: 500;
  color: #1e293b;
}

.module-stats {
  color: #64748b;
  font-size: 14px;
}

.task-distribution {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}
</style>
