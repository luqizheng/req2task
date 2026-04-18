<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Edit } from '@element-plus/icons-vue';
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
  { value: ProjectStatus.ACTIVE, label: '进行中' },
  { value: ProjectStatus.PLANNING, label: '规划中' },
  { value: ProjectStatus.COMPLETED, label: '已完成' },
  { value: ProjectStatus.ARCHIVED, label: '已归档' },
];

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'success',
    PLANNING: 'warning',
    COMPLETED: 'info',
    ARCHIVED: '',
  };
  return map[status] || '';
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
</script>

<template>
  <el-card class="info-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="card-title">项目信息</span>
        <el-button type="primary" size="small" :icon="Edit" @click="handleEdit">
          编辑
        </el-button>
      </div>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="项目 Key">
        <el-tag type="info">{{ project?.projectKey }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusTagType(project?.status || '')">
          {{ getStatusLabel(project?.status || '') }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="描述" :span="2">
        {{ project?.description || '暂无描述' }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ project?.createdAt ? new Date(project.createdAt).toLocaleString() : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ project?.updatedAt ? new Date(project.updatedAt).toLocaleString() : '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>

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
.info-card {
  flex: 1;
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
</style>
