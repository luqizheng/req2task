<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Delete, FolderOpened, Check, Warning } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import type { CollectionType, CreateCollectionDto } from '@/api/requirementCollection';

const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits<{
  (e: 'createSuccess', collectionId: string): void;
}>();

const store = useRequirementCollectStore();

const showCreateDialog = ref(false);
const createForm = ref({
  title: '',
  collectionType: 'meeting' as CollectionType,
  meetingMinutes: '',
});

const collectionTypeOptions = [
  { value: 'meeting', label: '会议', icon: '📅' },
  { value: 'interview', label: '访谈', icon: '💬' },
  { value: 'document', label: '文档', icon: '📄' },
  { value: 'other', label: '其他', icon: '📌' },
];

const selectedCollectionId = computed({
  get: () => store.currentCollection?.id || '',
  set: (value: string) => {
    if (value) {
      store.selectCollection(value);
    }
  },
});

const isCollectionActive = computed(() => {
  return store.currentCollection?.status === 'active';
});

const handleCreate = async () => {
  if (!createForm.value.title.trim()) {
    ElMessage.warning('请输入收集标题');
    return;
  }

  try {
    const dto: CreateCollectionDto = {
      projectId: props.projectId,
      title: createForm.value.title,
      collectionType: createForm.value.collectionType,
      meetingMinutes: createForm.value.meetingMinutes || undefined,
    };

    const result = await store.createCollection(dto);
    ElMessage.success('创建成功');
    showCreateDialog.value = false;
    resetForm();
    emit('createSuccess', result.id);
  } catch (error) {
    ElMessage.error('创建失败');
  }
};

const resetForm = () => {
  createForm.value = {
    title: '',
    collectionType: 'meeting',
    meetingMinutes: '',
  };
};

const handleDelete = async (id: string, title: string) => {
  try {
    await ElMessageBox.confirm(
      `确定删除收集"${title}"吗？`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    await store.deleteCollection(id);
    ElMessage.success('删除成功');
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleComplete = async () => {
  const unclarified = store.unclarifiedRequirements;
  if (unclarified.length > 0) {
    ElMessageBox.confirm(
      `还有 ${unclarified.length} 个需求未澄清，请先澄清或删除。\n\n未澄清需求：\n${unclarified.slice(0, 3).map(r => `• ${r.content.substring(0, 30)}...`).join('\n')}${unclarified.length > 3 ? '\n• ...' : ''}`,
      '无法完成收集',
      { confirmButtonText: '知道了', cancelButtonText: '取消', type: 'warning' }
    );
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要完成这次收集吗？\n\n收集总数：${store.rawRequirements.length} 条\n\n完成后将无法继续向此收集添加需求。`,
      '完成收集确认',
      { confirmButtonText: '确认完成', cancelButtonText: '取消', type: 'info' }
    );

    const result = await store.completeCollection();
    if (result.success) {
      ElMessage.success('收集已完成');
    } else {
      ElMessage.warning(result.message || '完成收集失败');
    }
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const getCollectionTypeLabel = (type: CollectionType) => {
  return collectionTypeOptions.find(t => t.value === type)?.label || type;
};

const getCollectionTypeIcon = (type: CollectionType) => {
  return collectionTypeOptions.find(t => t.value === type)?.icon || '📌';
};
</script>

<template>
  <div class="requirement-collect-header">
    <div class="collection-selector">
      <el-select
        v-model="selectedCollectionId"
        placeholder="选择需求收集"
        clearable
        class="collection-select"
        :disabled="store.collections.length === 0"
      >
        <template #prefix>
          <el-icon><FolderOpened /></el-icon>
        </template>
        <el-option
          v-for="collection in store.collections"
          :key="collection.id"
          :label="collection.title"
          :value="collection.id"
        >
          <div class="collection-option">
            <span class="option-icon">{{ getCollectionTypeIcon(collection.collectionType) }}</span>
            <span class="option-title">{{ collection.title }}</span>
            <span class="option-count">{{ collection.rawRequirementCount }} 条</span>
            <el-button
              :icon="Delete"
              text
              size="small"
              class="option-delete"
              @click.stop="handleDelete(collection.id, collection.title)"
            />
          </div>
        </el-option>
      </el-select>

      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        新建收集
      </el-button>
    </div>

    <div v-if="store.currentCollection" class="current-collection-info">
      <el-tag size="large" effect="plain">
        {{ getCollectionTypeIcon(store.currentCollection.collectionType) }}
        {{ getCollectionTypeLabel(store.currentCollection.collectionType) }}
      </el-tag>
      <el-tag
        :type="isCollectionActive ? 'success' : 'info'"
        size="large"
        effect="plain"
      >
        {{ isCollectionActive ? '进行中' : '已完成' }}
      </el-tag>
      <span class="info-text">
        创建者：{{ store.currentCollection.collectedBy?.displayName || '未知' }}
      </span>
      <span class="info-text">
        {{ store.currentCollection.rawRequirementCount }} 条原始需求
      </span>
      <el-button
        v-if="isCollectionActive"
        type="success"
        :icon="Check"
        size="small"
        @click="handleComplete"
        :disabled="store.unclarifiedRequirements.length > 0"
      >
        完成收集
      </el-button>
      <el-tooltip
        v-if="isCollectionActive && store.unclarifiedRequirements.length > 0"
        content="所有需求澄清或删除后才能完成收集"
        placement="top"
      >
        <el-icon class="warning-icon"><Warning /></el-icon>
      </el-tooltip>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="创建需求收集"
      width="500px"
      destroy-on-close
    >
      <el-form :model="createForm" label-width="100">
        <el-form-item label="收集标题" required>
          <el-input v-model="createForm.title" placeholder="如：2024年Q1需求调研会议" />
        </el-form-item>

        <el-form-item label="收集类型" required>
          <el-radio-group v-model="createForm.collectionType">
            <el-radio
              v-for="option in collectionTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.icon }} {{ option.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="会议纪要">
          <el-input
            v-model="createForm.meetingMinutes"
            type="textarea"
            :rows="4"
            placeholder="可选，填写会议纪要或讨论要点"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="store.isLoading">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.requirement-collect-header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.collection-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.collection-select {
  width: 300px;
}

.collection-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-icon {
  font-size: 16px;
}

.option-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-count {
  color: #909399;
  font-size: 12px;
}

.option-delete {
  opacity: 0;
  transition: opacity 0.2s;
}

.collection-option:hover .option-delete {
  opacity: 1;
}

.current-collection-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.info-text {
  color: #606266;
  font-size: 14px;
}

.warning-icon {
  color: #e6a23c;
  font-size: 18px;
  margin-left: 8px;
}
</style>
