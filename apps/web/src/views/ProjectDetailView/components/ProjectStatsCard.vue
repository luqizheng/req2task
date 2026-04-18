<script setup lang="ts">
import { computed } from 'vue';
import type { ProjectResponseDto } from '@req2task/dto';

interface Props {
  project: ProjectResponseDto | null;
  requirementCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  requirementCount: 0,
  taskCount: 0,
  completedTaskCount: 0,
});

const completionRate = computed(() => {
  if (props.taskCount === 0) return 0;
  return Math.round((props.completedTaskCount / props.taskCount) * 100);
});

const memberCount = computed(() => {
  return props.project?.members?.length || 0;
});
</script>

<template>
  <el-card class="stats-card">
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-value">{{ requirementCount }}</div>
          <div class="stat-label">需求总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-value">{{ taskCount }}</div>
          <div class="stat-label">任务总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-value stat-highlight">{{ completionRate }}%</div>
          <div class="stat-label">完成率</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-item">
          <div class="stat-value">{{ memberCount }}</div>
          <div class="stat-label">成员数量</div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped>
.stats-card {
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
  padding: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-highlight {
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}
</style>
