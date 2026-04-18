<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Plus, List } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FeatureModuleResponseDto, CreateFeatureModuleDto, UpdateFeatureModuleDto } from '@req2task/dto';

interface Props {
  modules: FeatureModuleResponseDto[];
  loading?: boolean;
  projectId: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  reload: [];
}>();

const dialogVisible = ref(false);
const dialogTitle = ref('添加模块');
const formRef = ref<FormInstance>();
const formData = reactive({
  id: null as string | null,
  name: '',
  description: '',
  moduleKey: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入模块名称', trigger: 'blur' }],
  moduleKey: [
    { required: true, message: '请输入模块 Key', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9]*$/, message: '模块 Key 必须是大写字母开头', trigger: 'blur' },
  ],
};

const handleAdd = () => {
  dialogTitle.value = '添加模块';
  Object.assign(formData, {
    id: null,
    name: '',
    description: '',
    moduleKey: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: FeatureModuleResponseDto) => {
  dialogTitle.value = '编辑模块';
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    moduleKey: row.moduleKey,
  });
  dialogVisible.value = true;
};

const handleDelete = (row: FeatureModuleResponseDto) => {
  ElMessageBox.confirm(`确定删除模块 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        const { featureModulesApi } = await import('@/api/featureModules');
        await featureModulesApi.delete(row.id);
        ElMessage.success('删除成功');
        emit('reload');
      } catch (error) {
        ElMessage.error((error as Error).message || '删除失败');
      }
    })
    .catch(() => {});
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const { featureModulesApi } = await import('@/api/featureModules');
        if (formData.id) {
          const updateData: UpdateFeatureModuleDto = {
            name: formData.name,
            description: formData.description,
          };
          await featureModulesApi.update(formData.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateFeatureModuleDto = {
            name: formData.name,
            description: formData.description,
            moduleKey: formData.moduleKey,
            projectId: props.projectId,
          };
          await featureModulesApi.create(props.projectId, createData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        emit('reload');
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleViewRequirements = (module: FeatureModuleResponseDto) => {
  window.location.href = `/projects/${props.projectId}/modules/${module.id}/requirements`;
};

const handleCreateRequirement = (module: FeatureModuleResponseDto) => {
  window.location.href = `/projects/${props.projectId}/modules/${module.id}/requirements?action=create`;
};
</script>

<template>
  <el-card class="module-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">功能模块</span>
        <el-button type="primary" size="small" :icon="Plus" @click="handleAdd">
          添加模块
        </el-button>
      </div>
    </template>
    <el-table :data="modules" v-loading="loading" stripe>
      <el-table-column prop="name" label="模块名称" min-width="150" />
      <el-table-column prop="moduleKey" label="模块 Key" width="120">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.moduleKey }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewRequirements(row)">
            <el-icon><List /></el-icon>
            需求
          </el-button>
          <el-button type="success" link size="small" @click="handleCreateRequirement(row)">
            创建需求
          </el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80">
      <el-form-item label="模块名称" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="模块 Key" prop="moduleKey" v-if="!formData.id">
        <el-input v-model="formData.moduleKey" placeholder="如: MOD" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="formData.description" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.module-card {
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
</style>
