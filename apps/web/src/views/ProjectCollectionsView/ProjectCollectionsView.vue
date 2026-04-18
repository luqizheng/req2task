<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, Delete, ChatDotRound, ArrowLeft, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import { useProjectStore } from '@/stores/project';
import type { CreateCollectionDto, CollectionType } from '@/api/requirementCollection';
import CollectionCreateDialog from './components/CollectionCreateDialog.vue';

const route = useRoute();
const router = useRouter();
const store = useRequirementCollectStore();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectId as string);
const projectName = computed(() => projectStore.currentProject?.name || route.query.name as string || '项目');

const showCreateDialog = ref(false);
const formInitialData = ref({
  title: '',
  collectionType: 'meeting' as CollectionType,
  meetingMinutes: '',
});

const collectionTypeOptions = [
  { value: 'meeting', label: '会议' },
  { value: 'interview', label: '访谈' },
  { value: 'document', label: '文档' },
  { value: 'other', label: '其他' },
];

const getTypeLabel = (type: CollectionType) => {
  return collectionTypeOptions.find(t => t.value === type)?.label || type;
};

const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'info';
};

const loadCollections = async () => {
  try {
    await store.fetchCollections(projectId.value);
  } catch {
    ElMessage.error('加载收集列表失败');
  }
};

const handleCreate = async (data: { title: string; collectionType: CollectionType; meetingMinutes: string }) => {
  try {
    const dto: CreateCollectionDto = {
      projectId: projectId.value,
      title: data.title,
      collectionType: data.collectionType,
    };
    if (data.meetingMinutes) {
      dto.meetingMinutes = data.meetingMinutes;
    }
    const collection = await store.createCollection(dto);
    ElMessage.success('创建成功');
    handleOpenCollection(collection.id);
  } catch {
    ElMessage.error('创建失败');
  }
};

const handleOpenCollection = (collectionId: string) => {
  router.push(`/projects/${projectId.value}/modules/collect?collectionId=${collectionId}`);
};

const handleDelete = async (collectionId: string, title: string) => {
  try {
    await ElMessageBox.confirm(
      `确定删除收集"${title}"吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await store.deleteCollection(collectionId);
    ElMessage.success('删除成功');
    loadCollections();
  } catch (error) {
    if ((error as Error).message !== 'cancel') {
      ElMessage.error((error as Error).message || '删除失败');
    }
  }
};

const handleBack = () => {
  router.push(`/projects/${projectId.value}`);
};

onMounted(async () => {
  await projectStore.fetchProjectById(projectId.value);
  loadCollections();
});
</script>

<template>
  <div class="project-collections-view">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">返回</el-button>
        <h1 class="page-title">需求收集 - {{ projectName }}</h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadCollections" :loading="store.isLoading">
          刷新
        </el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          新建收集
        </el-button>
      </div>
    </div>

    <div class="content">
      <el-empty v-if="!store.isLoading && store.collections.length === 0" description="暂无收集记录">
        <el-button type="primary" @click="showCreateDialog = true">创建第一个收集</el-button>
      </el-empty>

      <div v-else class="collection-list">
        <el-card
          v-for="collection in store.collections"
          :key="collection.id"
          class="collection-card"
          shadow="hover"
        >
          <div class="collection-content">
            <div class="collection-main">
              <div class="collection-header">
                <span class="collection-title">{{ collection.title }}</span>
                <el-tag :type="getStatusType(collection.status)" size="small">
                  {{ collection.status === 'active' ? '进行中' : '已完成' }}
                </el-tag>
                <el-tag size="small">{{ getTypeLabel(collection.collectionType) }}</el-tag>
              </div>
              <div class="collection-meta">
                <span>收集人：{{ collection.collectedBy?.displayName || collection.collectedBy?.username || '-' }}</span>
                <span>收集时间：{{ new Date(collection.collectedAt).toLocaleDateString() }}</span>
              </div>
              <div class="collection-stats">
                <span><ChatDotRound /> {{ collection.rawRequirementCount }} 条原始需求</span>
                <span>{{ collection.chatRoundCount }} 轮对话</span>
              </div>
            </div>
            <div class="collection-actions">
              <el-button type="primary" @click="handleOpenCollection(collection.id)">
                打开
              </el-button>
              <el-button type="danger" :icon="Delete" @click="handleDelete(collection.id, collection.title)">
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <CollectionCreateDialog
      v-model="showCreateDialog"
      :initial-data="formInitialData"
      :collection-type-options="collectionTypeOptions"
      @confirm="handleCreate"
    />
  </div>
</template>

<style scoped>
.project-collections-view {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  min-height: 400px;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-card {
  border-left: 3px solid var(--el-color-primary);
}

.collection-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-main {
  flex: 1;
}

.collection-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.collection-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.collection-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.collection-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.collection-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collection-actions {
  display: flex;
  gap: 8px;
}
</style>
