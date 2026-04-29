<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, MoreFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTaskStore } from '@/stores/task';
import type { CreateTaskDto, UpdateTaskDto } from '@req2task/dto';

const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  CODE_REVIEW: 'code_review',
  TESTING: 'testing',
  DONE: 'done',
} as const;

const TaskPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();

const requirementId = computed(() => route.params.requirementId as string);

const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('创建任务');
const formRef = ref<FormInstance>();
const formData = reactive({
  id: null as string | null,
  title: '',
  description: '',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  assigneeId: '',
  estimatedHours: 0,
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
};

const columnConfig = [
  { key: TaskStatus.TODO, label: '待办', color: '#94a3b8' },
  { key: TaskStatus.IN_PROGRESS, label: '进行中', color: '#3b82f6' },
  { key: TaskStatus.CODE_REVIEW, label: '代码审查', color: '#f59e0b' },
  { key: TaskStatus.TESTING, label: '测试', color: '#8b5cf6' },
  { key: TaskStatus.DONE, label: '完成', color: '#22c55e' },
];

const getPriorityTagType = (priority: string) => {
  const map: Record<string, string> = {
    [TaskPriority.CRITICAL]: 'danger',
    [TaskPriority.HIGH]: 'warning',
    [TaskPriority.MEDIUM]: 'primary',
    [TaskPriority.LOW]: 'info',
  };
  return map[priority] || '';
};

const getTasksByColumn = (status: string) => {
  const column = taskStore.kanbanBoard.find((c) => c.status === status);
  return column?.tasks || [];
};

const loadBoard = async () => {
  loading.value = true;
  try {
    await taskStore.fetchKanbanBoard(requirementId.value);
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  dialogTitle.value = '创建任务';
  Object.assign(formData, {
    id: null,
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeId: '',
    estimatedHours: 0,
  });
  dialogVisible.value = true;
};

const handleEdit = (task: { id: string; title: string; description: string | null; status: string; priority: string }) => {
  dialogTitle.value = '编辑任务';
  Object.assign(formData, {
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assigneeId: '',
    estimatedHours: 0,
  });
  dialogVisible.value = true;
};

const handleDelete = async (task: { id: string; title: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定删除任务 "${task.title}" 吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await taskStore.deleteTask(task.id);
    ElMessage.success('删除成功');
    loadBoard();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          const updateData: UpdateTaskDto = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority as UpdateTaskDto['priority'],
          };
          await taskStore.updateTask(formData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateTaskDto = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority as CreateTaskDto['priority'],
            estimatedHours: formData.estimatedHours,
          };
          await taskStore.createTask(requirementId.value, createData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadBoard();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleViewDetail = (task: { id: string }) => {
  router.push(`/tasks/${task.id}`);
};

const handleStatusChange = async (task: { id: string }, targetStatus: string) => {
  try {
    await taskStore.transitionTaskStatus(task.id, targetStatus);
    ElMessage.success('状态更新成功');
    loadBoard();
  } catch (error) {
    ElMessage.error((error as Error).message || '状态更新失败');
  }
};

onMounted(() => {
  loadBoard();
});
</script>

<template>
  <div class="task-board" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()">返回</el-button>
      <h2 class="page-title">任务看板</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">创建任务</el-button>
    </div>

    <div class="kanban-board">
      <div
        v-for="column in columnConfig"
        :key="column.key"
        class="kanban-column"
      >
        <div class="column-header" :style="{ borderColor: column.color }">
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
          >
            <div class="task-header">
              <span class="task-title">{{ task.title }}</span>
            </div>
            <div class="task-meta">
              <el-tag :type="getPriorityTagType(task.priority)" size="small">
                {{ task.priority }}
              </el-tag>
              <el-tag v-if="task.assignedTo" size="small" type="info">
                {{ task.assignedTo?.displayName || task.assignedTo?.username }}
              </el-tag>
            </div>
            <div class="task-actions">
              <el-dropdown trigger="click">
                <el-button :icon="MoreFilled" text size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleViewDetail(task)">查看详情</el-dropdown-item>
                    <el-dropdown-item @click="handleEdit(task)">编辑</el-dropdown-item>
                    <template v-if="column.key !== TaskStatus.TODO">
                      <el-dropdown-item
                        v-for="col in columnConfig.filter(c => c.key !== column.key)"
                        :key="col.key"
                        @click="handleStatusChange(task, col.key)"
                      >
                        移动到 {{ col.label }}
                      </el-dropdown-item>
                    </template>
                    <el-dropdown-item divided @click="handleDelete(task)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div v-if="!getTasksByColumn(column.key).length" class="empty-column">
            暂无任务
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="formData.priority" style="width: 100%">
            <el-option label="紧急" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="formData.id">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="代码审查" value="code_review" />
            <el-option label="测试" value="testing" />
            <el-option label="完成" value="done" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计工时">
          <el-input-number v-model="formData.estimatedHours" :min="0" :max="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.task-board {
  padding: 20px;
  height: 100%;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.kanban-board {
  display: flex;
  gap: 16px;
  height: calc(100vh - 180px);
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-column {
  flex: 1;
  min-width: 280px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  border-radius: 8px;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 3px solid;
}

.column-title {
  font-weight: 600;
  color: #1e293b;
}

.column-count {
  flex-shrink: 0;
}

.column-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.task-header {
  margin-bottom: 8px;
}

.task-title {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.task-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.task-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-column {
  text-align: center;
  color: #94a3b8;
  padding: 20px;
  font-size: 14px;
}
</style>
