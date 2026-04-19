<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh, Clock, Document, User } from '@element-plus/icons-vue';
import { tasksApi } from '@/api/tasks';
import type { TaskResponseDto } from '@req2task/dto';

interface KanbanColumn {
  status: string;
  label: string;
  tasks: TaskResponseDto[];
}

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const loading = ref(false);
const kanbanBoard = ref<KanbanColumn[]>([]);

const statusLabels: Record<string, string> = {
  'todo': '待办',
  'in_progress': '进行中',
  'in_review': '审核中',
  'done': '完成',
  'blocked': '阻塞',
  'cancelled': '已取消',
};

const statusColors: Record<string, string> = {
  'todo': '#94a3b8',
  'in_progress': '#3b82f6',
  'in_review': '#f59e0b',
  'done': '#22c55e',
  'blocked': '#ef4444',
  'cancelled': '#6b7280',
};

const columnConfig = [
  { key: 'todo', label: '待办', icon: '📋' },
  { key: 'in_progress', label: '进行中', icon: '⚡' },
  { key: 'in_review', label: '审核中', icon: '👀' },
  { key: 'done', label: '完成', icon: '✅' },
  { key: 'blocked', label: '阻塞', icon: '🚧' },
];

const getPriorityTagType = (priority: string) => {
  const map: Record<string, string> = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'primary',
    'low': 'info',
  };
  return map[priority] || '';
};

const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    'critical': '#ef4444',
    'high': '#f59e0b',
    'medium': '#3b82f6',
    'low': '#94a3b8',
  };
  return map[priority] || '#94a3b8';
};

const getTasksByColumn = (status: string) => {
  const column = kanbanBoard.value.find((c) => c.status === status);
  return column?.tasks || [];
};

const loadBoard = async () => {
  loading.value = true;
  try {
    const data = await tasksApi.getProjectKanbanBoard(props.projectId);
    if (data && data.byStatus) {
      kanbanBoard.value = Object.entries(data.byStatus).map(([status, tasks]) => ({
        status,
        label: statusLabels[status] || status,
        tasks: tasks as TaskResponseDto[],
      }));
    }
  } catch {
    ElMessage.error('加载任务看板失败');
  } finally {
    loading.value = false;
  }
};

const handleViewTask = (task: TaskResponseDto) => {
  router.push(`/tasks/${task.id}`);
};

const handleViewRequirement = (task: TaskResponseDto) => {
  router.push(`/requirements/${task.requirementId}`);
};

onMounted(() => {
  loadBoard();
});

defineExpose({ reload: loadBoard });
</script>

<template>
  <div class="task-board-container" v-loading="loading">
    <header class="board-header">
      <div class="header-left">
        <h3 class="board-title">任务看板</h3>
        <div class="board-stats">
          <span class="stat-item">
            共 {{ kanbanBoard.reduce((sum, col) => sum + col.tasks.length, 0) }} 个任务
          </span>
        </div>
      </div>
      <el-button :icon="Refresh" circle @click="loadBoard" />
    </header>

    <div class="kanban-board">
      <div
        v-for="column in columnConfig"
        :key="column.key"
        class="kanban-column"
      >
        <div class="column-header" :style="{ '--status-color': statusColors[column.key] }">
          <div class="column-title-section">
            <span class="column-icon">{{ column.icon }}</span>
            <span class="column-title">{{ column.label }}</span>
          </div>
          <div class="column-count-wrapper">
            <span class="column-count">{{ getTasksByColumn(column.key).length }}</span>
          </div>
        </div>

        <div class="column-content">
          <TransitionGroup name="task-list" tag="div" class="task-list">
            <div
              v-for="task in getTasksByColumn(column.key)"
              :key="task.id"
              class="task-card"
              @click="handleViewTask(task)"
            >
              <div class="task-priority-indicator" :style="{ background: getPriorityColor(task.priority) }" />

              <div class="task-header">
                <span class="task-no">{{ task.taskNo }}</span>
                <el-tag :type="getPriorityTagType(task.priority)" size="small" effect="plain">
                  {{ task.priority }}
                </el-tag>
              </div>

              <h4 class="task-title">{{ task.title }}</h4>

              <div class="task-requirement" @click.stop="handleViewRequirement(task)">
                <el-icon><Document /></el-icon>
                {{ task.requirementId.slice(0, 8) }}
              </div>

              <div class="task-footer">
                <div class="task-meta">
                  <span v-if="task.assignedTo" class="task-assignee">
                    <el-icon><User /></el-icon>
                    {{ (task.assignedTo as any).displayName || task.assignedToId?.slice(0, 8) }}
                  </span>
                  <span v-if="task.estimatedHours" class="task-hours">
                    <el-icon><Clock /></el-icon>
                    {{ task.estimatedHours }}h
                  </span>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="getTasksByColumn(column.key).length === 0" class="empty-column">
            <div class="empty-icon">{{ column.icon }}</div>
            <p class="empty-text">暂无任务</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.board-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.01em;
}

.board-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  font-size: 13px;
  color: #64748b;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 20px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.kanban-column {
  min-width: 280px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-bottom: 3px solid var(--status-color);
  border-radius: 12px 12px 0 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.column-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-icon {
  font-size: 20px;
}

.column-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.column-count-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background: var(--status-color);
  border-radius: 8px;
}

.column-count {
  color: white;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.column-content {
  padding: 12px;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  flex: 1;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  position: relative;
  background: white;
  border-radius: 10px;
  padding: 16px;
  padding-left: 20px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--priority-color, #94a3b8);
  opacity: 0;
  transition: opacity 0.2s;
}

.task-card:hover {
  transform: translateY(-2px) translateX(2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.task-card:hover::before {
  opacity: 1;
}

.task-priority-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: width 0.2s;
}

.task-card:hover .task-priority-indicator {
  width: 6px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-no {
  font-size: 12px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 10px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-requirement {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #3b82f6;
  margin-bottom: 12px;
  padding: 4px 8px;
  background: #eff6ff;
  border-radius: 4px;
  transition: all 0.2s;
}

.task-requirement:hover {
  background: #dbeafe;
  transform: translateX(2px);
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.task-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.task-assignee,
.task-hours {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.task-assignee .el-icon,
.task-hours .el-icon {
  font-size: 14px;
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.4;
  margin-bottom: 12px;
}

.empty-text {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@media (max-width: 1280px) {
  .kanban-board {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .task-board-container {
    padding: 16px;
  }

  .board-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .kanban-board {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .kanban-column {
    min-width: 100%;
  }
}
</style>
