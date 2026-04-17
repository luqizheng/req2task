<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Delete, Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTaskStore } from '@/stores/task';
import type { UpdateTaskDto } from '@req2task/dto';

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

const taskId = computed(() => route.params.id as string);

const loading = ref(false);
const isEditing = ref(false);
const activeTab = ref('info');

const formRef = ref<FormInstance>();
const formData = reactive({
  title: '',
  description: '',
  status: '',
  priority: '',
  estimatedHours: 0,
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
};

const statusOptions = [
  { value: TaskStatus.TODO, label: '待办', color: '#94a3b8' },
  { value: TaskStatus.IN_PROGRESS, label: '进行中', color: '#3b82f6' },
  { value: TaskStatus.CODE_REVIEW, label: '代码审查', color: '#f59e0b' },
  { value: TaskStatus.TESTING, label: '测试', color: '#8b5cf6' },
  { value: TaskStatus.DONE, label: '完成', color: '#22c55e' },
];

const priorityOptions = [
  { value: TaskPriority.CRITICAL, label: '紧急' },
  { value: TaskPriority.HIGH, label: '高' },
  { value: TaskPriority.MEDIUM, label: '中' },
  { value: TaskPriority.LOW, label: '低' },
];

const getStatusLabel = (status: string) => {
  return statusOptions.find((s) => s.value === status)?.label || status;
};

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    [TaskStatus.TODO]: 'info',
    [TaskStatus.IN_PROGRESS]: 'primary',
    [TaskStatus.CODE_REVIEW]: 'warning',
    [TaskStatus.TESTING]: '',
    [TaskStatus.DONE]: 'success',
  };
  return map[status] || '';
};

const loadTask = async () => {
  loading.value = true;
  try {
    await taskStore.fetchTaskById(taskId.value);
    await taskStore.fetchAllowedTransitions(taskId.value);
    if (taskStore.currentTask) {
      formData.title = taskStore.currentTask.title;
      formData.description = taskStore.currentTask.description || '';
      formData.status = taskStore.currentTask.status;
      formData.priority = taskStore.currentTask.priority;
      formData.estimatedHours = taskStore.currentTask.estimatedHours || 0;
    }
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  if (taskStore.currentTask) {
    formData.title = taskStore.currentTask.title;
    formData.description = taskStore.currentTask.description || '';
    formData.priority = taskStore.currentTask.priority;
  }
  isEditing.value = false;
};

const handleSave = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const updateData: UpdateTaskDto = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority as UpdateTaskDto['priority'],
        };
        await taskStore.updateTask(taskId.value, updateData);
        ElMessage.success('保存成功');
        isEditing.value = false;
      } catch (error) {
        ElMessage.error((error as Error).message || '保存失败');
      }
    }
  });
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定删除此任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await taskStore.deleteTask(taskId.value);
    ElMessage.success('删除成功');
    router.back();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleStatusChange = async (status: string) => {
  try {
    await taskStore.transitionTaskStatus(taskId.value, status);
    ElMessage.success('状态更新成功');
    await loadTask();
  } catch (error) {
    ElMessage.error((error as Error).message || '状态更新失败');
  }
};

onMounted(() => {
  loadTask();
});
</script>

<template>
  <div class="task-detail" v-loading="loading">
    <div class="page-header">
      <el-button @click="router.back()">返回</el-button>
      <h2 class="page-title">任务详情</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Edit" @click="handleEdit">编辑</el-button>
        <el-button type="danger" :icon="Delete" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="基本信息" name="info">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">基本信息</span>
              <template v-if="!isEditing">
                <el-button type="primary" size="small" :icon="Edit" @click="handleEdit">编辑</el-button>
              </template>
              <template v-else>
                <el-button size="small" @click="handleCancelEdit">取消</el-button>
                <el-button type="success" size="small" @click="handleSave">保存</el-button>
              </template>
            </div>
          </template>
          <el-form ref="formRef" :model="formData" :rules="rules" label-width="100" :disabled="!isEditing">
            <el-form-item label="任务标题" prop="title">
              <el-input v-model="formData.title" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="formData.description" type="textarea" :rows="4" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="formData.priority" style="width: 100%">
                <el-option v-for="p in priorityOptions" :key="p.value" :label="p.label" :value="p.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-tag :type="getStatusTagType(taskStore.currentTask?.status || '')">
                {{ getStatusLabel(taskStore.currentTask?.status || '') }}
              </el-tag>
            </el-form-item>
            <el-form-item label="预计工时">
              <span>{{ formData.estimatedHours }} 小时</span>
            </el-form-item>
            <el-form-item label="负责人" v-if="taskStore.currentTask?.assignedTo">
              <span>{{ taskStore.currentTask.assignedTo?.displayName || taskStore.currentTask.assignedTo?.username }}</span>
            </el-form-item>
            <el-form-item label="创建时间">
              <span>{{ taskStore.currentTask?.createdAt ? new Date(taskStore.currentTask.createdAt).toLocaleString() : '-' }}</span>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="mt-16">
          <template #header>
            <span class="card-title">状态流转</span>
          </template>
          <div class="status-transition">
            <div class="current-status">
              当前状态：
              <el-tag :type="getStatusTagType(taskStore.currentTask?.status || '')" size="large">
                {{ getStatusLabel(taskStore.currentTask?.status || '') }}
              </el-tag>
            </div>
            <div class="transition-buttons" v-if="taskStore.allowedTransitions.length">
              <el-button
                v-for="status in taskStore.allowedTransitions"
                :key="status"
                @click="handleStatusChange(status)"
              >
                流转到 {{ getStatusLabel(status) }}
              </el-button>
            </div>
            <div v-else class="no-transitions">暂无可用的状态流转</div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="依赖关系" name="dependencies">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">依赖关系</span>
              <el-button type="primary" size="small" :icon="Plus">添加依赖</el-button>
            </div>
          </template>
          <div class="empty-tip">暂无依赖任务</div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.task-detail {
  padding: 20px;
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

.header-actions {
  display: flex;
  gap: 8px;
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

.mt-16 {
  margin-top: 16px;
}

.status-transition {
  padding: 8px 0;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.transition-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.no-transitions {
  color: #94a3b8;
  font-size: 14px;
}

.dependency-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dependency-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40px;
}
</style>
