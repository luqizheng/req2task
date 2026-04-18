<script setup lang="ts">
import { useRouter } from 'vue-router';
import { MagicStick, TrendCharts, Collection, Document, ChatDotRound } from '@element-plus/icons-vue';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();
const router = useRouter();

const actions = [
  {
    key: 'ai-gen',
    label: 'AI 生成需求',
    icon: MagicStick,
    type: 'primary',
    path: () => `/ai/requirement-gen?projectId=${props.projectId}`,
  },
  {
    key: 'collect',
    label: '需求收集',
    icon: ChatDotRound,
    type: 'success',
    path: () => `/projects/${props.projectId}/collections`,
  },
  {
    key: 'progress',
    label: '项目进度',
    icon: TrendCharts,
    type: '',
    path: () => `/projects/${props.projectId}/progress`,
  },
  {
    key: 'baselines',
    label: '基线管理',
    icon: Collection,
    type: '',
    path: () => `/projects/${props.projectId}/baselines`,
  },
  {
    key: 'docs',
    label: '项目文档',
    icon: Document,
    type: '',
    path: () => `/projects/${props.projectId}/docs`,
  },
];

const handleAction = (action: typeof actions[0]) => {
  router.push(action.path());
};
</script>

<template>
  <el-card class="quick-actions-card">
    <template #header>
      <span class="card-title">快速操作</span>
    </template>
    <div class="quick-actions">
      <el-button
        v-for="action in actions"
        :key="action.key"
        :type="action.type as any"
        @click="handleAction(action)"
      >
        <el-icon><component :is="action.icon" /></el-icon>
        {{ action.label }}
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.quick-actions-card {
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
