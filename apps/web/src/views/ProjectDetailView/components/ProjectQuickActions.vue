<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  MagicStick,
  TrendCharts,
  Collection,
  Document,
  ChatDotRound,
  Setting,
  Promotion,
  ArrowRight
} from '@element-plus/icons-vue';

type ViewMode = 'admin' | 'developer' | 'tester' | 'product';

interface Props {
  projectId: string;
  viewMode?: ViewMode;
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'admin',
});

const router = useRouter();

const getActionsByMode = () => {
  const adminActions = [
    {
      key: 'ai-gen',
      label: 'AI 生成',
      icon: MagicStick,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      description: '智能生成需求',
      path: `/ai/requirement-gen?projectId=${props.projectId}`,
    },
    {
      key: 'collect',
      label: '需求收集',
      icon: ChatDotRound,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      description: '收集多方需求',
      path: `/projects/${props.projectId}/collections`,
    },
    {
      key: 'progress',
      label: '项目进度',
      icon: TrendCharts,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      description: '查看进度报表',
      path: `/projects/${props.projectId}/progress`,
    },
    {
      key: 'baselines',
      label: '基线管理',
      icon: Collection,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      description: '管理项目基线',
      path: `/projects/${props.projectId}/baselines`,
    },
  ];

  const developerActions = [
    {
      key: 'tasks',
      label: '我的任务',
      icon: Setting,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      description: '查看指派任务',
      path: `/projects/${props.projectId}/tasks?assignee=me`,
    },
    {
      key: 'modules',
      label: '功能模块',
      icon: Collection,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      description: '浏览模块结构',
      path: `/projects/${props.projectId}/modules`,
    },
    {
      key: 'docs',
      label: '技术文档',
      icon: Document,
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      description: '查看开发文档',
      path: `/projects/${props.projectId}/docs`,
    },
  ];

  const testerActions = [
    {
      key: 'test-cases',
      label: '测试用例',
      icon: Setting,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      description: '管理测试用例',
      path: `/projects/${props.projectId}/test-cases`,
    },
    {
      key: 'bugs',
      label: '缺陷跟踪',
      icon: TrendCharts,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      description: '跟踪缺陷状态',
      path: `/projects/${props.projectId}/bugs`,
    },
    {
      key: 'verify',
      label: '需求验证',
      icon: MagicStick,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      description: '验证需求实现',
      path: `/projects/${props.projectId}/verification`,
    },
  ];

  const productActions = [
    {
      key: 'ai-gen',
      label: 'AI 生成',
      icon: MagicStick,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      description: '智能生成需求',
      path: `/ai/requirement-gen?projectId=${props.projectId}`,
    },
    {
      key: 'requirements',
      label: '需求管理',
      icon: Collection,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      description: '管理所有需求',
      path: `/projects/${props.projectId}/requirements`,
    },
    {
      key: 'roadmap',
      label: '产品路线图',
      icon: Promotion,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      description: '规划产品路线',
      path: `/projects/${props.projectId}/roadmap`,
    },
  ];

  switch (props.viewMode) {
    case 'developer':
      return developerActions;
    case 'tester':
      return testerActions;
    case 'product':
      return productActions;
    default:
      return adminActions;
  }
};

const actions = getActionsByMode();

const handleAction = (path: string) => {
  router.push(path);
};
</script>

<template>
  <div class="quick-actions-container">
    <header class="actions-header">
      <h3 class="header-title">快速操作</h3>
    </header>

    <div class="actions-grid">
      <button
        v-for="action in actions"
        :key="action.key"
        class="action-card"
        @click="handleAction(action.path)"
      >
        <div class="action-icon-wrapper" :style="{ background: action.gradient }">
          <el-icon :size="24" class="action-icon">
            <component :is="action.icon" />
          </el-icon>
        </div>
        <div class="action-content">
          <span class="action-label">{{ action.label }}</span>
          <span class="action-description">{{ action.description }}</span>
        </div>
        <el-icon class="action-arrow"><ArrowRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.quick-actions-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.actions-header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.01em;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  width: 100%;
}

.action-card:hover {
  background: white;
  border-color: #cbd5e1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-card:active {
  transform: translateX(2px);
}

.action-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
  transition: transform 0.25s;
}

.action-card:hover .action-icon-wrapper {
  transform: scale(1.05);
}

.action-icon {
  color: white;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.action-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.action-description {
  font-size: 13px;
  color: #64748b;
}

.action-arrow {
  font-size: 18px;
  color: #94a3b8;
  transition: all 0.25s;
}

.action-card:hover .action-arrow {
  color: #2563eb;
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .quick-actions-container {
    padding: 16px;
  }

  .actions-grid {
    gap: 8px;
  }

  .action-card {
    padding: 12px;
    gap: 12px;
  }

  .action-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .action-label {
    font-size: 14px;
  }

  .action-description {
    font-size: 12px;
  }
}
</style>
