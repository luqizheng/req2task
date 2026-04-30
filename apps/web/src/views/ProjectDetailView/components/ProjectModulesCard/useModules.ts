import { ref } from 'vue';
import type { CreateFeatureModuleDto, UpdateFeatureModuleDto } from '@req2task/dto';
import { featureModulesApi } from '@/api/featureModules';
import { toast } from 'vue-sonner';

export interface FeatureModule {
  id: string;
  name: string;
  description: string | null;
  moduleKey: string;
  sort: number;
  parentId: string | null;
  children: FeatureModule[];
}

export function useModules(projectId: string) {
  const modules = ref<FeatureModule[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const fetchModules = async () => {
    try {
      loading.value = true;
      const data = await featureModulesApi.getTree(projectId);
      modules.value = data || [];
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载模块失败';
      toast.error(error.value);
    } finally {
      loading.value = false;
    }
  };

  const createModule = async (data: CreateFeatureModuleDto) => {
    await featureModulesApi.create(projectId, data);
    toast.success('模块已创建');
    await fetchModules();
  };

  const updateModule = async (id: string, data: UpdateFeatureModuleDto) => {
    await featureModulesApi.update(id, data);
    toast.success('模块已更新');
    await fetchModules();
  };

  const deleteModule = async (id: string) => {
    await featureModulesApi.delete(id);
    toast.success('模块已删除');
    await fetchModules();
  };

  const getAllModules = (moduleList: FeatureModule[]): FeatureModule[] => {
    const result: FeatureModule[] = [];
    const traverse = (items: FeatureModule[]) => {
      for (const m of items) {
        result.push(m);
        if (m.children?.length) traverse(m.children);
      }
    };
    traverse(moduleList);
    return result;
  };

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    getAllModules,
  };
}
