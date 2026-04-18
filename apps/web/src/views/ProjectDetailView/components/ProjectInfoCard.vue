<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Edit, InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ProjectStatus } from '@req2task/dto';
import type { ProjectResponseDto, UpdateProjectDto } from '@req2task/dto';

interface Props {
  project: ProjectResponseDto | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  update: [data: UpdateProjectDto];
}>();

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<{
  name: string;
  description: string;
  status: ProjectStatus;
}>({
  name: '',
  description: '',
  status: ProjectStatus.ACTIVE,
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
};

const statusOptions = [
  { value: ProjectStatus.ACTIVE, label: '进行中', color: '#10b981' },
  { value: ProjectStatus.PLANNING, label: '规划中', color: '#f59e0b' },
  { value: ProjectStatus.COMPLETED, label: '已完成', color: '#3b82f6' },
  { value: ProjectStatus.ARCHIVED, label: '已归档', color: '#94a3b8' },
];

const getStatusStyle = (status: string) => {
  const option = statusOptions.find(s => s.value === status);
  return {
    color: option?.color || '#94a3b8',
    background: `${option?.color}15` || '#f1f5f9',
  };
};

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status;
};

const handleEdit = () => {
  if (!props.project) return;
  formData.name = props.project.name;
  formData.description = props.project.description || '';
  formData.status = props.project.status || ProjectStatus.ACTIVE;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('update', {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      dialogVisible.value = false;
    }
  });
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="info-card-container" v-loading="loading">
    <header class="card-header">
      <div class="header-left">
        <el-icon class="header-icon"><InfoFilled /></el-icon>
        <h3 class="card-title">项目信息</h3>
      </div>
      <el-button type="primary" :icon="Edit" @click="handleEdit" size="small">
        编辑
      </el-button>
    </header>

    <div class="card-content">
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">项目 Key</span>
          <el-tag effect="plain" class="info-tag">{{ project?.projectKey || '-' }}</el-tag>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="status-badge" :style="getStatusStyle(project?.status || '')">
            {{ getStatusLabel(project?.status || '') }}
          </span>
        </div>
      </div>

      <div class="info-section">
        <div class="info-row full-width">
          <span class="info-label">描述</span>
          <p class="info-description">
            {{ project?.description || '暂无描述' }}
          </p>
        </div>
      </div>

      <div class="info-section timeline">
        <div class="timeline-item">
          <div class="timeline-marker created"></div>
          <div class="timeline-content">
            <span class="timeline-label">创建时间</span>
            <span class="timeline-value">{{ formatDate(project?.createdAt) }}</span>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-marker updated"></div>
          <div class="timeline-content">
            <span class="timeline-label">更新时间</span>
            <span class="timeline-value">{{ formatDate(project?.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" title="编辑项目" width="500px" destroy-on-close>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入项目名称" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formData.status" style="width: 100%">
          <el-option
            v-for="s in statusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入项目描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.info-card-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
  color: #2563eb;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-row.full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  min-width: 80px;
}

.info-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.info-description {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  line-height: 1.6;
}

.timeline {
  position: relative;
  padding-left: 20px;
  border-left: 2px solid #e2e8f0;
}

.timeline-item {
  position: relative;
  padding: 8px 0;
}

.timeline-marker {
  position: absolute;
  left: -25px;
  top: 12px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
}

.timeline-marker.created {
  background: #3b82f6;
}

.timeline-marker.updated {
  background: #10b981;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-label {
  font-size: 12px;
  color: #94a3b8;
}

.timeline-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .info-card-container {
    padding: 16px;
  }

  .card-header {
    margin-bottom: 16px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .info-label {
    min-width: auto;
  }
}
</style>
