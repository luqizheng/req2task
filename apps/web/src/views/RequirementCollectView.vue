<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  Refresh,
  Plus,
  Delete,
  FolderOpened,
  Check,
  ArrowDown as ChevronDown,
  Warning,
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRequirementCollectStore } from '@/stores/requirementCollect';
import { useAiStore } from '@/stores/ai';
import type { CollectionType, CreateCollectionDto } from '@/api/requirementCollection';
import { AIChat } from '@req2task/ai-chat';
import '@req2task/ai-chat/dist/style.css';

const route = useRoute();
const router = useRouter();
const store = useRequirementCollectStore();
const aiStore = useAiStore();

const projectId = computed(() => route.params.projectId as string);
const collectionId = computed(() => route.params.collectionId as string | undefined);

const showSummary = ref(false);
const showCreateDialog = ref(false);
const createForm = ref({
  title: '',
  collectionType: 'meeting' as CollectionType,
  meetingMinutes: '',
});

const chatRef = ref<InstanceType<typeof AIChat> | null>(null);

const collectionTypeOptions = [
  { value: 'meeting', label: '会议' },
  { value: 'interview', label: '访谈' },
  { value: 'document', label: '文档' },
  { value: 'other', label: '其他' },
];

const selectedCollectionId = computed({
  get: () => store.currentCollection?.id || '',
  set: (value: string) => {
    if (value) store.selectCollection(value);
  },
});

const isCollectionActive = computed(() => store.currentCollection?.status === 'active');

const chatConfig = computed(() => ({
  endpoint: `/api/collections/${store.currentCollection?.id}/stream`,
  adapterName: 'requirement-collect',
  userRoleName: '用户',
  assistantRoleName: 'AI 需求分析师',
}));

const questionProgress = computed(() => {
  if (!store.currentRawRequirement) return null;
  return {
    current: store.currentQuestionCount,
    max: 5,
    percentage: Math.min((store.currentQuestionCount / 5) * 100, 100),
  };
});

const statusMap = {
  pending: { label: '待处理', type: 'info' },
  processing: { label: '分析中', type: 'warning' },
  clarified: { label: '已澄清', type: 'success' },
  converted: { label: '已转换', type: 'success' },
  discarded: { label: '已删除', type: 'info' },
};

const handleBack = () => router.push(`/projects/${projectId.value}`);

const loadData = async () => {
  try {
    await store.fetchCollections(projectId.value);
    if (aiStore.configs.length === 0) await aiStore.fetchConfigs();
    if (collectionId.value) await store.selectCollection(collectionId.value);
  } catch {
    ElMessage.error('加载数据失败');
  }
};

const handleCreate = async () => {
  if (!createForm.value.title.trim()) {
    ElMessage.warning('请输入收集标题');
    return;
  }
  try {
    const dto: CreateCollectionDto = {
      projectId: projectId.value,
      title: createForm.value.title,
      collectionType: createForm.value.collectionType,
      meetingMinutes: createForm.value.meetingMinutes || undefined,
    };
    const result = await store.createCollection(dto);
    ElMessage.success('创建成功');
    showCreateDialog.value = false;
    createForm.value = { title: '', collectionType: 'meeting', meetingMinutes: '' };
    router.replace(`/projects/${projectId.value}/collect/${result.id}`);
    await store.selectCollection(result.id);
  } catch {
    ElMessage.error('创建失败');
  }
};

const handleDelete = async (id: string, title: string) => {
  try {
    await ElMessageBox.confirm(`确定删除收集"${title}"吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.deleteCollection(id);
    ElMessage.success('删除成功');
  } catch (error) {
    if ((error as Error).message !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleComplete = async () => {
  const unclarified = store.unclarifiedRequirements;
  if (unclarified.length > 0) {
    ElMessageBox.confirm(
      `还有 ${unclarified.length} 个需求未澄清，请先澄清或删除。`,
      '无法完成收集',
      { confirmButtonText: '知道了', type: 'warning' }
    );
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要完成这次收集吗？\n收集总数：${store.rawRequirements.length} 条`,
      '完成收集确认',
      { confirmButtonText: '确认完成', cancelButtonText: '取消', type: 'info' }
    );
    const result = await store.completeCollection();
    if (result.success) ElMessage.success('收集已完成');
    else ElMessage.warning(result.message || '完成收集失败');
  } catch (error) {
    if ((error as Error).message !== 'cancel') ElMessage.error('操作失败');
  }
};

const handleDeleteRequirement = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个需求吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await store.deleteRequirement(id);
    ElMessage.success('删除成功');
  } catch (error) {
    if ((error as Error).message !== 'cancel') ElMessage.error('删除失败');
  }
};

const handleClarify = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要标记这个需求为已澄清吗？', '确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    });
    const raw = store.rawRequirements.find(r => r.id === id);
    if (raw) {
      await store.clarifyRequirement(id, raw.content);
      ElMessage.success('已标记为澄清');
    }
  } catch (error) {
    if ((error as Error).message !== 'cancel') ElMessage.error('操作失败');
  }
};

const handleMessageReceived = async () => {
  if (store.currentCollection) {
    await store.selectCollection(store.currentCollection.id);
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const truncateContent = (content: string, maxLength = 80) => {
  return content.length <= maxLength ? content : content.substring(0, maxLength) + '...';
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
};

const isClarified = (status: string) => ['clarified', 'converted', 'discarded'].includes(status);

const handleError = (error: Error) => {
  ElMessage.error(error.message || '发生错误');
};

onMounted(() => loadData());
watch([projectId, collectionId], () => {
  store.reset();
  loadData();
});
</script>

<template>
  <div class="collect-view">
    <header class="view-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">返回</el-button>
        <h1 class="view-title">需求收集</h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadData" :loading="store.isLoading">刷新</el-button>
      </div>
    </header>

    <div class="view-toolbar" v-if="store.currentCollection">
      <el-select
        v-model="selectedCollectionId"
        placeholder="选择收集"
        clearable
        class="collection-select"
      >
        <template #prefix><el-icon><FolderOpened /></el-icon></template>
        <el-option
          v-for="c in store.collections"
          :key="c.id"
          :label="c.title"
          :value="c.id"
        >
          <div class="collection-option">
            <span class="option-title">{{ c.title }}</span>
            <span class="option-count">{{ c.rawRequirementCount }} 条</span>
            <el-button
              :icon="Delete"
              text
              size="small"
              class="option-delete"
              @click.stop="handleDelete(c.id, c.title)"
            />
          </div>
        </el-option>
      </el-select>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建</el-button>
      <div class="toolbar-divider"></div>
      <el-tag size="large" effect="plain">
        {{ collectionTypeOptions.find(t => t.value === store.currentCollection?.collectionType)?.label }}
      </el-tag>
      <el-tag :type="isCollectionActive ? 'success' : 'info'" size="large" effect="plain">
        {{ isCollectionActive ? '进行中' : '已完成' }}
      </el-tag>
      <span class="info-text">{{ store.currentCollection.collectedBy?.displayName || '未知' }}</span>
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
      <el-tooltip v-if="isCollectionActive && store.unclarifiedRequirements.length > 0" content="所有需求澄清后才能完成收集">
        <el-icon class="warning-icon"><Warning /></el-icon>
      </el-tooltip>
    </div>

    <div class="view-body">
      <main class="chat-panel">
        <div v-if="!store.currentCollection" class="empty-state">
          <p>请选择或创建需求收集</p>
        </div>

        <template v-else>
          <div class="session-bar" v-if="store.currentRawRequirement">
            <span class="session-label">分析中：{{ truncateContent(store.currentRawRequirement.content, 40) }}</span>
            <div class="question-progress" v-if="questionProgress">
              <span>追问 {{ questionProgress.current }}/{{ questionProgress.max }}</span>
              <el-progress
                :percentage="questionProgress.percentage"
                :show-text="false"
                :stroke-width="3"
                :color="questionProgress.current >= 5 ? '#67c23a' : '#409eff'"
                style="width: 80px"
              />
            </div>
          </div>

          <AIChat
            ref="chatRef"
            :config="chatConfig"
            title="AI 需求分析师"
            placeholder="输入需求内容，AI 将帮助您分析和追问"
            max-height="100%"
            :show-window-header="false"
            @message-received="handleMessageReceived"
            @error="handleError"
          />
        </template>
      </main>

      <aside class="summary-panel" v-if="store.currentCollection">
        <div class="panel-header" @click="showSummary = !showSummary">
          <span>收集概览</span>
          <el-icon :class="{ rotated: showSummary }"><ChevronDown /></el-icon>
        </div>

        <transition name="collapse">
          <div v-show="showSummary" class="panel-body">
            <div class="summary-row">
              <span class="row-label">标题</span>
              <span class="row-value">{{ store.currentCollection.title }}</span>
            </div>
            <div class="summary-row">
              <span class="row-label">时间</span>
              <span class="row-value">{{ formatDate(store.currentCollection.collectedAt) }}</span>
            </div>
            <div class="summary-row">
              <span class="row-label">需求</span>
              <span class="row-value">{{ store.currentCollection.rawRequirementCount }} 条</span>
            </div>
          </div>
        </transition>

        <div class="requirements-section">
          <div class="section-header">
            <span>原始需求</span>
            <el-badge :value="store.rawRequirements.length" />
          </div>

          <div v-if="store.rawRequirements.length === 0" class="empty-requirements">
            暂无需求
          </div>

          <div v-else class="requirement-list">
            <div
              v-for="req in store.rawRequirements"
              :key="req.id"
              :class="['req-item', { active: store.currentRawRequirementId === req.id }]"
              @click="store.selectRawRequirement(req.id)"
            >
              <div class="req-header">
                <el-tag :type="statusMap[req.status].type" size="small">
                  {{ statusMap[req.status].label }}
                </el-tag>
                <span class="req-time">{{ formatRelativeTime(req.createdAt) }}</span>
                <div class="req-actions">
                  <el-button
                    v-if="!isClarified(req.status)"
                    :icon="Check"
                    text
                    size="small"
                    type="success"
                    @click.stop="handleClarify(req.id)"
                  />
                  <el-button
                    :icon="Delete"
                    text
                    size="small"
                    type="danger"
                    @click.stop="handleDeleteRequirement(req.id)"
                  />
                </div>
              </div>
              <div class="req-content">{{ truncateContent(req.content) }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <el-dialog v-model="showCreateDialog" title="创建需求收集" width="420px" destroy-on-close>
      <el-form :model="createForm" label-width="80">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" placeholder="如：Q1 需求调研" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="createForm.collectionType">
            <el-radio v-for="opt in collectionTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="会议纪要">
          <el-input v-model="createForm.meetingMinutes" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="store.isLoading">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.collect-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--el-bg-color-page);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.view-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-wrap: wrap;
}

.collection-select {
  width: 220px;
}

.collection-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.option-delete {
  opacity: 0;
  transition: opacity 0.2s;
}

.collection-option:hover .option-delete {
  opacity: 1;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--el-border-color-light);
}

.info-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.warning-icon {
  color: var(--el-color-warning);
  font-size: 16px;
}

.view-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  gap: 12px;
}

.session-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.session-label {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.question-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chat-panel :deep(.ai-chat) {
  flex: 1;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.chat-panel :deep(.ai-chat-window) {
  max-height: none;
  height: 100%;
  border: none;
  border-radius: 0;
}

.summary-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.panel-header:hover {
  background: var(--el-fill-color);
}

.panel-header .el-icon {
  transition: transform 0.2s;
  color: var(--el-text-color-secondary);
}

.panel-header .el-icon.rotated {
  transform: rotate(180deg);
}

.panel-body {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.row-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.row-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.requirements-section {
  flex: 1;
  overflow-y: auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.empty-requirements {
  padding: 32px 16px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.requirement-list {
  padding: 8px;
}

.req-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
}

.req-item:hover {
  background: var(--el-fill-color-light);
}

.req-item.active {
  background: var(--el-color-primary-light-9);
}

.req-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.req-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

.req-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.req-item:hover .req-actions {
  opacity: 1;
}

.req-content {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

@media (max-width: 1024px) {
  .summary-panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  }
}
</style>
