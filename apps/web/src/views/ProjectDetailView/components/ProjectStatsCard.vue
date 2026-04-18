<script setup lang="ts">
import { computed } from 'vue';
import { Document, List, Check, User } from '@element-plus/icons-vue';
import type { ProjectResponseDto } from '@req2task/dto';

type ViewMode = 'admin' | 'developer' | 'tester' | 'product';

interface Props {
  project: ProjectResponseDto | null;
  requirementCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  viewMode?: ViewMode;
}

const props = withDefaults(defineProps<Props>(), {
  requirementCount: 0,
  taskCount: 0,
  completedTaskCount: 0,
  viewMode: 'admin',
});

const completionRate = computed(() => {
  if (props.taskCount === 0) return 0;
  return Math.round((props.completedTaskCount / props.taskCount) * 100);
});

const memberCount = computed(() => {
  return props.project?.members?.length || 0;
});

const stats = computed(() => {
  const base = [
    {
      key: 'requirements',
      label: '需求总数',
      value: props.requirementCount,
      icon: Document,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    },
    {
      key: 'tasks',
      label: '任务总数',
      value: props.taskCount,
      icon: List,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    },
    {
      key: 'completion',
      label: '完成率',
      value: `${completionRate.value}%`,
      icon: Check,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      key: 'members',
      label: '成员数量',
      value: memberCount.value,
      icon: User,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  ];

  if (props.viewMode === 'developer') {
    return base.filter(s => ['tasks', 'completion', 'members'].includes(s.key));
  }
  if (props.viewMode === 'tester') {
    return base.filter(s => ['requirements', 'tasks', 'completion'].includes(s.key));
  }
  if (props.viewMode === 'product') {
    return base.filter(s => ['requirements', 'tasks', 'members'].includes(s.key));
  }
  return base;
});
</script>

<template>
  <div class="stats-card-grid">
    <div
      v-for="stat in stats"
      :key="stat.key"
      class="stat-card"
    >
      <div class="stat-icon-wrapper" :style="{ background: stat.gradient }">
        <el-icon :size="24" class="stat-icon">
          <component :is="stat.icon" />
        </el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
      <div
        v-if="stat.key === 'completion'"
        class="completion-ring"
        :style="{ '--percentage': completionRate }"
      >
        <svg viewBox="0 0 36 36">
          <path
            class="ring-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="ring-fill"
            :stroke="stat.color"
            :stroke-dasharray="`${completionRate}, 100`"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  padding: 0;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.1), transparent);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-icon {
  color: white;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.completion-ring {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
}

.completion-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #e2e8f0;
  stroke-width: 3;
}

.ring-fill {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

@media (max-width: 768px) {
  .stats-card-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    gap: 12px;
  }

  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 22px;
  }

  .completion-ring {
    width: 36px;
    height: 36px;
    top: 12px;
    right: 12px;
  }
}
</style>
