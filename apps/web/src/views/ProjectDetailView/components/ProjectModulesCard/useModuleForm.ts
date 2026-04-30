import { ref, reactive, computed } from 'vue';
import type { FeatureModule } from './useModules';

export interface ModuleFormData {
  name: string;
  description: string;
  parentId: string | undefined;
  moduleKey: string;
}

export function useModuleForm() {
  const showCreateDialog = ref(false);
  const showEditDialog = ref(false);
  const showDeleteDialog = ref(false);
  const selectedModule = ref<FeatureModule | null>(null);
  const submitting = ref(false);

  const formData = reactive<ModuleFormData>({
    name: '',
    description: '',
    parentId: undefined,
    moduleKey: '',
  });

  const isCreateValid = computed(() => {
    return formData.name.trim() && formData.moduleKey.trim();
  });

  const isEditValid = computed(() => {
    return formData.name.trim();
  });

  const resetForm = () => {
    formData.name = '';
    formData.description = '';
    formData.parentId = undefined;
    formData.moduleKey = '';
  };

  const openCreateDialog = () => {
    resetForm();
    showCreateDialog.value = true;
  };

  const openEditDialog = (module: FeatureModule) => {
    selectedModule.value = module;
    formData.name = module.name;
    formData.description = module.description || '';
    formData.parentId = module.parentId || undefined;
    formData.moduleKey = module.moduleKey;
    showEditDialog.value = true;
  };

  const openDeleteDialog = (module: FeatureModule) => {
    selectedModule.value = module;
    showDeleteDialog.value = true;
  };

  const closeCreateDialog = () => {
    showCreateDialog.value = false;
  };

  const closeEditDialog = () => {
    showEditDialog.value = false;
    selectedModule.value = null;
  };

  const closeDeleteDialog = () => {
    showDeleteDialog.value = false;
    selectedModule.value = null;
  };

  return {
    showCreateDialog,
    showEditDialog,
    showDeleteDialog,
    selectedModule,
    submitting,
    formData,
    isCreateValid,
    isEditValid,
    resetForm,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeCreateDialog,
    closeEditDialog,
    closeDeleteDialog,
  };
}
