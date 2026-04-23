import { ref, computed } from 'vue';
import type { FeatureModuleResponseDto } from '@req2task/dto';

export enum ModuleType {
  SYSTEM = 'system',
  BUSINESS = 'business',
  FEATURE = 'feature',
}

export const MODULE_TYPE_COLORS: Record<ModuleType, string> = {
  [ModuleType.SYSTEM]: '#409EFF',
  [ModuleType.BUSINESS]: '#67C23A',
  [ModuleType.FEATURE]: '#E6A23C',
};

export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  [ModuleType.SYSTEM]: '系统级',
  [ModuleType.BUSINESS]: '业务级',
  [ModuleType.FEATURE]: '功能级',
};

interface UseModuleTreeFilterOptions {
  hiddenTypes?: ModuleType[];
}

export function useModuleTreeFilter(options: UseModuleTreeFilterOptions = {}) {
  const hiddenTypes = ref<Set<ModuleType>>(
    new Set(options.hiddenTypes || [])
  );

  const visibleTypes = computed(() => {
    return Object.values(ModuleType).filter(
      (type) => !hiddenTypes.value.has(type)
    );
  });

  const isTypeVisible = (type?: ModuleType): boolean => {
    if (!type) return true;
    return !hiddenTypes.value.has(type);
  };

  const toggleType = (type: ModuleType) => {
    if (hiddenTypes.value.has(type)) {
      hiddenTypes.value.delete(type);
    } else {
      hiddenTypes.value.add(type);
    }
    hiddenTypes.value = new Set(hiddenTypes.value);
  };

  const filterTree = (
    modules: FeatureModuleResponseDto[]
  ): FeatureModuleResponseDto[] => {
    return modules
      .filter((module) => {
        const type = (module as FeatureModuleResponseDto & { moduleType?: ModuleType }).moduleType;
        return isTypeVisible(type);
      })
      .map((module) => {
        if (module.children && module.children.length > 0) {
          return {
            ...module,
            children: filterTree(module.children),
          };
        }
        return { ...module };
      });
  };

  return {
    hiddenTypes,
    visibleTypes,
    isTypeVisible,
    toggleType,
    filterTree,
  };
}
