import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  TaskResponseDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStatisticsDto,
} from '@req2task/dto';
import { tasksApi } from '@/api/tasks';
import type { TaskListParams } from '@/api/tasks';

interface KanbanColumn {
  status: string;
  label: string;
  tasks: TaskResponseDto[];
}

export const useTaskStore = defineStore('task', () => {
  const taskList = ref<TaskResponseDto[]>([]);
  const kanbanBoard = ref<KanbanColumn[]>([]);
  const currentTask = ref<TaskResponseDto | null>(null);
  const taskStatistics = ref<TaskStatisticsDto | null>(null);
  const loading = ref(false);
  const total = ref(0);
  const allowedTransitions = ref<string[]>([]);

  const fetchTaskList = async (
    requirementId: string,
    params?: TaskListParams
  ) => {
    loading.value = true;
    try {
      const result = await tasksApi.getListByRequirement(requirementId, params);
      taskList.value = result.items;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  };

  const fetchKanbanBoard = async (requirementId: string) => {
    loading.value = true;
    try {
      const data = await tasksApi.getKanbanBoard(requirementId);
      const statusLabels: Record<string, string> = {
        'todo': '待办',
        'in_progress': '进行中',
        'code_review': '代码审查',
        'testing': '测试',
        'done': '完成',
        'in_review': '审核中',
        'blocked': '阻塞',
        'cancelled': '已取消',
      };
      kanbanBoard.value = Object.entries(data.byStatus).map(([status, tasks]) => ({
        status,
        label: statusLabels[status] || status,
        tasks,
      }));
    } finally {
      loading.value = false;
    }
  };

  const fetchTaskStatistics = async (requirementId: string) => {
    loading.value = true;
    try {
      taskStatistics.value = await tasksApi.getTaskStatistics(requirementId);
    } finally {
      loading.value = false;
    }
  };

  const fetchTaskById = async (id: string) => {
    loading.value = true;
    try {
      const data = await tasksApi.getById(id);
      currentTask.value = data;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (requirementId: string, data: CreateTaskDto) => {
    loading.value = true;
    try {
      return await tasksApi.create(requirementId, data);
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (id: string, data: UpdateTaskDto) => {
    loading.value = true;
    try {
      const result = await tasksApi.update(id, data);
      currentTask.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  };

  const deleteTask = async (id: string) => {
    loading.value = true;
    try {
      await tasksApi.delete(id);
    } finally {
      loading.value = false;
    }
  };

  const transitionTaskStatus = async (id: string, targetStatus: string) => {
    loading.value = true;
    try {
      const data = await tasksApi.transitionStatus(id, targetStatus);
      currentTask.value = data;
      return data;
    } finally {
      loading.value = false;
    }
  };

  const fetchAllowedTransitions = async (id: string) => {
    loading.value = true;
    try {
      const result = await tasksApi.getAllowedTransitions(id);
      allowedTransitions.value = result.allowedTransitions;
    } finally {
      loading.value = false;
    }
  };

  const addDependency = async (id: string, dependencyTaskId: string) => {
    loading.value = true;
    try {
      const result = await tasksApi.addDependency(id, dependencyTaskId);
      currentTask.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  };

  const removeDependency = async (id: string, dependencyTaskId: string) => {
    loading.value = true;
    try {
      const result = await tasksApi.removeDependency(id, dependencyTaskId);
      currentTask.value = result;
      return result;
    } finally {
      loading.value = false;
    }
  };

  return {
    taskList,
    kanbanBoard,
    currentTask,
    taskStatistics,
    loading,
    total,
    allowedTransitions,
    fetchTaskList,
    fetchKanbanBoard,
    fetchTaskStatistics,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    transitionTaskStatus,
    fetchAllowedTransitions,
    addDependency,
    removeDependency,
  };
});
