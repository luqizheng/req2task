<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { featureModulesApi } from '@/api/featureModules';
import type { FeatureModuleResponseDto } from '@req2task/dto';
import {
  useModuleTreeFilter,
  ModuleType,
  MODULE_TYPE_COLORS,
  MODULE_TYPE_LABELS,
} from '@/composables/useModuleTreeFilter';

interface Props {
  projectId: string;
  defaultExpandAll?: boolean;
  filterable?: boolean;
  defaultHiddenTypes?: ModuleType[];
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpandAll: false,
  filterable: false,
  defaultHiddenTypes: () => [],
});

const emit = defineEmits<{
  'node-click': [data: FeatureModuleResponseDto];
}>();

const loading = ref(false);
const moduleTree = ref<FeatureModuleResponseDto[]>([]);

const { hiddenTypes, visibleTypes, filterTree } =
  useModuleTreeFilter({
    hiddenTypes: props.defaultHiddenTypes,
  });

const filteredTree = computed(() => filterTree(moduleTree.value));

const loadModuleTree = async () => {
  loading.value = true;
  try {
    moduleTree.value = await featureModulesApi.getTree(props.projectId);
  } catch (error) {
    console.error('Failed to load module tree:', error);
  } finally {
    loading.value = false;
  }
};

const handleNodeClick = (data: FeatureModuleResponseDto) => {
  emit('node-click', data);
};

const getTypeColor = (type?: ModuleType): string => {
  if (!type) return '#909399';
  return MODULE_TYPE_COLORS[type] || '#909399';
};

const getTypeLabel = (type?: ModuleType): string => {
  if (!type) return '未知';
  return MODULE_TYPE_LABELS[type] || '未知';
};

const isTypeChecked = (type: ModuleType): boolean => {
  return !hiddenTypes.value.has(type);
};

const getModuleType = (data: FeatureModuleResponseDto): ModuleType | undefined => {
  return (data as FeatureModuleResponseDto & { moduleType?: ModuleType }).moduleType;
};

const handleCheckboxChange = (type: ModuleType, checked: boolean) => {
  if (checked) {
    hiddenTypes.value.delete(type);
  } else {
    hiddenTypes.value.add(type);
  }
  hiddenTypes.value = new Set(hiddenTypes.value);
};

onMounted(() => {
  loadModuleTree();
});
</script>

<template>
  <div class="module-tree">
    <div v-if="filterable" class="filter-bar">
      <span class="filter-label">筛选：</span>
      <el-checkbox-group v-model="visibleTypes" class="filter-checkboxes">
        <el-checkbox
          v-for="type in Object.values(ModuleType)"
          :key="type"
          :value="type"
          :checked="isTypeChecked(type)"
          @change="(val: boolean) => handleCheckboxChange(type, val)"
        >
          <span class="type-label">
            <span
              class="type-dot"
              :style="{ backgroundColor: getTypeColor(type) }"
            ></span>
            {{ getTypeLabel(type) }}
          </span>
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <div class="tree-container" v-loading="loading">
      <el-empty
        v-if="!loading && filteredTree.length === 0"
        description="暂无功能模块"
        :image-size="80"
      />
      <el-tree
        v-else
        :data="filteredTree"
        :props="{
          children: 'children',
          label: 'name',
        }"
        :default-expand-all="defaultExpandAll"
        node-key="id"
        @node-click="handleNodeClick"
      >
        <template #default="{ data }">
          <span class="tree-node">
            <span class="node-name">{{ data.name }}</span>
            <el-tag
              v-if="getModuleType(data)"
              size="small"
              :color="getTypeColor(getModuleType(data))"
              style="margin-left: 8px; color: #fff; border: none"
            >
              {{ getTypeLabel(getModuleType(data)) }}
            </el-tag>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<style scoped>
.module-tree {
  width: 100%;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.filter-checkboxes {
  display: flex;
  gap: 16px;
}

.type-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tree-container {
  min-height: 200px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
}

.node-name {
  font-size: 14px;
}
</style>
