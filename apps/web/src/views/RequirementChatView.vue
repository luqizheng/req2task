<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh, Warning, Search, Plus } from '@element-plus/icons-vue';
import { useAiStore } from '@/stores/ai';

interface ConflictItem {
  id: string;
  type: string;
  description: string;
}

interface ConflictResult {
  conflicts: ConflictItem[];
}

interface SimilarRequirement {
  id: string;
  title: string;
  similarity?: number;
}

interface TaskNode {
  name: string;
  estimate?: number;
  subtasks?: TaskNode[];
}

const route = useRoute();
const router = useRouter();
const aiStore = useAiStore();

const requirementId = computed(() => route.params.id as string);

const isLoading = ref(false);
const conflictResult = ref<ConflictResult | null>(null);
const similarRequirements = ref<SimilarRequirement[]>([]);
const decomposedTasks = ref<TaskNode[]>([]);
const searchQuery = ref('');

const conflictTypes = [
  { key: 'logical', label: '逻辑冲突', color: 'danger' },
  { key: 'dependency', label: '依赖冲突', color: 'warning' },
  { key: 'duplicate', label: '重复冲突', color: 'info' },
  { key: 'priority', label: '优先级冲突', color: 'primary' },
];

const getConflictTypeColor = (type: string) => {
  const conflict = conflictTypes.find((c) => c.key === type);
  return conflict?.color || 'info';
};

const getConflictTypeLabel = (type: string) => {
  const conflict = conflictTypes.find((c) => c.key === type);
  return conflict?.label || type;
};

const handleDetectConflicts = async () => {
  isLoading.value = true;
  try {
    await aiStore.fetchConfigs();
    ElMessage.info('冲突检测功能开发中');
  } catch (error) {
    ElMessage.error((error as Error).message || '检测失败');
  } finally {
    isLoading.value = false;
  }
};

const handleSearchSimilar = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容');
    return;
  }

  isLoading.value = true;
  try {
    await aiStore.fetchConfigs();
    ElMessage.info('相似需求搜索功能开发中');
  } catch (error) {
    ElMessage.error((error as Error).message || '搜索失败');
  } finally {
    isLoading.value = false;
  }
};

const handleDecompose = async () => {
  isLoading.value = true;
  try {
    await aiStore.fetchConfigs();
    ElMessage.info('任务分解功能开发中');
  } catch (error) {
    ElMessage.error((error as Error).message || '分解失败');
  } finally {
    isLoading.value = false;
  }
};

const handleViewRequirement = (req: any) => {
  router.push(`/requirements/${req.id}`);
};

onMounted(async () => {
  await aiStore.fetchConfigs();
});
</script>

<template>
  <div class="requirement-chat" v-loading="isLoading">
    <div class="page-header">
      <el-button @click="router.back()">返回</el-button>
      <h2 class="page-title">需求分析助手</h2>
    </div>

    <el-row :gutter="24">
      <el-col :span="10">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">需求信息</span>
          </template>
          <div class="requirement-info">
            <p>需求 ID: {{ requirementId }}</p>
            <p>点击右上角 AI 对话按钮进行需求分析</p>
          </div>
        </el-card>

        <el-card class="conflict-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Warning /></el-icon>
                冲突检测
              </span>
              <el-button
                type="primary"
                size="small"
                :icon="Refresh"
                @click="handleDetectConflicts"
              >
                检测
              </el-button>
            </div>
          </template>

          <div v-if="conflictResult" class="conflict-list">
            <div
              v-for="conflict in conflictResult.conflicts"
              :key="conflict.id"
              class="conflict-item"
            >
              <el-tag :type="getConflictTypeColor(conflict.type)" size="small">
                {{ getConflictTypeLabel(conflict.type) }}
              </el-tag>
              <div class="conflict-desc">{{ conflict.description }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无冲突检测结果">
            <template #image>
              <div style="font-size: 48px">🔍</div>
            </template>
          </el-empty>
        </el-card>

        <el-card class="similar-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Search /></el-icon>
                相似需求
              </span>
            </div>
          </template>

          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="输入内容搜索相似需求"
              clearable
              @keyup.enter="handleSearchSimilar"
            />
            <el-button type="primary" @click="handleSearchSimilar">
              搜索
            </el-button>
          </div>

          <div v-if="similarRequirements.length" class="similar-list">
            <div
              v-for="req in similarRequirements"
              :key="req.id"
              class="similar-item"
              @click="handleViewRequirement(req)"
            >
              <div class="similar-title">{{ req.title }}</div>
              <div class="similar-score">
                相似度: {{ ((req.similarity || 0) * 100).toFixed(0) }}%
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无相似需求推荐">
            <template #image>
              <div style="font-size: 48px">📋</div>
            </template>
          </el-empty>
        </el-card>

        <el-card class="decompose-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Plus /></el-icon>
                任务分解
              </span>
              <el-button
                type="primary"
                size="small"
                :icon="Refresh"
                @click="handleDecompose"
              >
                AI 分解
              </el-button>
            </div>
          </template>

          <div v-if="decomposedTasks.length" class="decompose-tree">
            <el-tree
              :data="decomposedTasks"
              :props="{ label: 'name', children: 'subtasks' }"
              default-expand-all
            >
              <template #default="{ data }">
                <span class="task-node">
                  <span>{{ data.name }}</span>
                  <el-tag v-if="data.estimate" size="small" type="info">
                    {{ data.estimate }}h
                  </el-tag>
                </span>
              </template>
            </el-tree>
          </div>
          <el-empty v-else description="暂无分解结果">
            <template #image>
              <div style="font-size: 48px">🧩</div>
            </template>
          </el-empty>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="chat-card">
          <template #header>
            <span class="card-title">AI 助手</span>
          </template>
          <div class="chat-placeholder">
            <el-empty description="请在右侧 AI 对话页面进行需求分析">
              <template #image>
                <div style="font-size: 64px">🤖</div>
              </template>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.requirement-chat {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-card,
.conflict-card,
.similar-card,
.decompose-card,
.chat-card {
  margin-bottom: 20px;
}

.requirement-info {
  color: #64748b;
  line-height: 1.8;
}

.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-box .el-input {
  flex: 1;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conflict-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.conflict-desc {
  margin-top: 8px;
  color: #64748b;
  font-size: 14px;
}

.similar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.similar-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.similar-item:hover {
  background: #e2e8f0;
}

.similar-title {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.similar-score {
  font-size: 12px;
  color: #64748b;
}

.chat-placeholder {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
