<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useProjectStore } from '@/stores/project';
import { featureModulesApi } from '@/api/featureModules';
import type { FeatureModuleResponseDto, CreateFeatureModuleDto, UpdateFeatureModuleDto } from '@req2task/dto';
import type { FormInstance, FormRules } from 'element-plus';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const loading = ref(false);
const modules = ref<FeatureModuleResponseDto[]>([]);

const dialogVisible = ref(false);
const dialogTitle = ref('添加模块');
const formRef = ref<FormInstance>();
const formData = ref({
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

const projectId = computed(() => route.params.id as string);

const loadProject = async () => {
  loading.value = true;
  try {
    await projectStore.fetchProjectById(projectId.value);
  } finally {
    loading.value = false;
  }
};

const loadModules = async () => {
  loading.value = true;
  try {
    const data = await featureModulesApi.getList(projectId.value);
    modules.value = data.items;
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  dialogTitle.value = '添加模块';
  formData.value = {
    id: null,
    name: '',
    description: '',
    moduleKey: '',
  };
  dialogVisible.value = true;
};

const handleEdit = (row: FeatureModuleResponseDto) => {
  dialogTitle.value = '编辑模块';
  formData.value = {
    id: row.id,
    name: row.name,
    description: row.description || '',
    moduleKey: row.moduleKey,
  };
  dialogVisible.value = true;
};

const handleDelete = async (row: FeatureModuleResponseDto) => {
  try {
    await featureModulesApi.delete(row.id);
    ElMessage.success('删除成功');
    await loadModules();
  } catch (error) {
    ElMessage.error((error as Error).message || '删除失败');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.value.id) {
          const updateData: UpdateFeatureModuleDto = {
            name: formData.value.name,
            description: formData.value.description,
          };
          await featureModulesApi.update(formData.value.id, updateData);
          ElMessage.success('更新成功');
        } else {
          const createData: CreateFeatureModuleDto = {
            name: formData.value.name,
            description: formData.value.description,
            moduleKey: formData.value.moduleKey,
            projectId: projectId.value,
          };
          await featureModulesApi.create(projectId.value, createData);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        await loadModules();
      } catch (error) {
        ElMessage.error((error as Error).message || '操作失败');
      }
    }
  });
};

const handleViewRequirements = (module: FeatureModuleResponseDto) => {
  router.push(`/projects/${projectId.value}/modules/${module.id}/requirements`);
};

const handleRequirementCollect = (module: FeatureModuleResponseDto) => {
  router.push(`/projects/${projectId.value}/modules/${module.id}/collect`);
};

const handleRawRequirementCollect = (module: FeatureModuleResponseDto) => {
  router.push(`/projects/${projectId.value}/modules/${module.id}/raw-requirements`);
};

onMounted(async () => {
  await loadProject();
  await loadModules();
});
</script>

<template>
  <div class="project-modules">
    <div class="page-header">
      <el-button @click="router.push('/projects')">返回项目列表</el-button>
      <el-button @click="router.push(`/projects/${projectId}`)">返回项目详情</el-button>
      <h2 class="page-title">{{ projectStore.currentProject?.name || '项目' }} - 功能模块</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加模块</el-button>
      </div>
    </div>

    <el-card class="module-card" v-loading="loading">
      <el-table :data="modules" stripe>
        <el-table-column prop="name" label="模块名称" min-width="150" />
        <el-table-column prop="moduleKey" label="模块 Key" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.moduleKey }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewRequirements(row)">
              需求列表
            </el-button>
            <el-button type="success" link size="small" @click="handleRequirementCollect(row)">
              需求收集
            </el-button>
            <el-button type="warning" link size="small" @click="handleRawRequirementCollect(row)">
              原始需求
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="modules.length === 0 && !loading" description="暂无模块，请点击添加模块">
        <el-button type="primary" @click="handleAdd">添加模块</el-button>
      </el-empty>
    </el-card>
  </div>

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
.project-modules {
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

.module-card {
  margin-bottom: 16px;
}
</style>
