<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
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
  { key: 'todo', label: '待办' },
  { key: 'in_progress', label: '进行中' },
  { key: 'in_review', label: '审核中' },
  { key: 'done', label: '完成' },
  { key: 'blocked', label: '阻塞' },
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

const getTasksByColumn = (status: string) => {
  const column = kanbanBoard.value.find((c) => c.status === status);
  return column?.tasks || [];
};

const loadBoard = async () => {
  loading.value = true;
  try {
    const res = await tasksApi.getProjectKanbanBoard(props.projectId);
    const data = res.data?.data;
    if (data) {
      kanbanBoard.value = Object.entries(data).map(([status, tasks]) => ({
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
  <el-card class="project-task-board" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="card-title">任务看板</span>
        <el-button size="small" @click="loadBoard">刷新</el-button>
      </div>
    </template>
    <div class="kanban-board">
      <div
        v-for="column in columnConfig"
        :key="column.key"
        class="kanban-column"
      >
        <div class="column-header" :style="{ borderColor: statusColors[column.key] }">
          <span class="column-title">{{ column.label }}</span>
          <el-badge
            :value="getTasksByColumn(column.key).length"
            :max="99"
            class="column-count"
          />
        </div>
        <div class="column-content">
          <div
            v-for="task in getTasksByColumn(column.key)"
            :key="task.id"
            class="task-card"
            @click="handleViewTask(task)"
          >
            <div class="task-header">
              <span class="task-no">{{ task.taskNo }}</span>
              <el-tag :type="getPriorityTagType(task.priority)" size="small">
                {{ task.priority }}
              </el-tag>
            </div>
            <div class="task-title">{{ task.title }}</div>
            <div v-if="task.requirement" class="task-requirement" @click.stop="handleViewRequirement(task)">
              📋 {{ (task.requirement as any).title || task.requirementId.slice(0, 8) }}
            </div>
            <div class="task-footer">
              <span v-if="task.assignedTo" class="task-assignee">
                {{ (task.assignedTo as any).displayName || task.assignedToId?.slice(0, 8) }}
              </span>
              <span v-if="task.estimatedHours" class="task-hours">
                ⏱️ {{ task.estimatedHours }}h
              </span>
            </div>
          </div>
          <el-empty
            v-if="getTasksByColumn(column.key).length === 0"
            description="暂无任务"
            :image-size="60"
          />
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.project-task-board {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.kanban-column {
  min-width: 220px;
  max-width: 280px;
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 3px solid;
  border-radius: 8px 8px 0 0;
  background: white;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
}

.column-content {
  padding: 8px;
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card {
  background: white;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s, transform 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-no {
  font-size: 11px;
  color: #909399;
  font-family: monospace;
}

.task-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
}

.task-requirement {
  font-size: 11px;
  color: #409eff;
  margin-bottom: 6px;
  cursor: pointer;
}

.task-requirement:hover {
  text-decoration: underline;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #909399;
}

.task-assignee,
.task-hours {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
