<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';
import RequirementCollectHeader from '@/components/requirement/RequirementCollectHeader.vue';
import RequirementCollectChat from '@/components/requirement/RequirementCollectChat.vue';
import RequirementCollectSidebar from '@/components/requirement/RequirementCollectSidebar.vue';

const route = useRoute();
const router = useRouter();
const store = useRequirementCollectStore();
const aiStore = useAiStore();

const projectId = computed(() => route.params.projectId as string);
const showSidebar = ref(true);

const handleBack = () => {
  router.push(`/projects/${projectId.value}`);
};

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

const loadData = async () => {
  try {
    await store.fetchCollections(projectId.value);
    if (aiStore.configs.length === 0) {
      await aiStore.fetchConfigs();
    }
  } catch (error) {
    ElMessage.error('加载数据失败');
  }
};

const handleCreateSuccess = async (collectionId: string) => {
  await store.selectCollection(collectionId);
};

onMounted(() => {
  loadData();
});

watch(projectId, () => {
  store.reset();
  loadData();
});
</script>

<template>
  <div class="requirement-collect-view">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">返回</el-button>
        <h1 class="page-title">AI 需求收集工作台</h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadData" :loading="store.isLoading">
          刷新
        </el-button>
        <el-button @click="toggleSidebar">
          {{ showSidebar ? '收起侧边' : '展开侧边' }}
        </el-button>
      </div>
    </div>

    <RequirementCollectHeader
      :project-id="projectId"
      @create-success="handleCreateSuccess"
    />

    <div class="main-content">
      <div class="chat-area">
        <RequirementCollectChat
          :disabled="!store.currentCollection"
        />
      </div>

      <transition name="slide">
        <div v-if="showSidebar" class="sidebar-area">
          <RequirementCollectSidebar />
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.requirement-collect-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
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

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chat-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 16px;
  margin-right: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.sidebar-area {
  width: 400px;
  flex-shrink: 0;
  margin: 16px;
  margin-left: 8px;
  overflow-y: auto;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 1024px) {
  .sidebar-area {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 400px;
    margin: 0;
    background: white;
    z-index: 100;
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  }
}
</style>
