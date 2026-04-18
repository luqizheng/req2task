<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, MagicStick } from '@element-plus/icons-vue';

const router = useRouter();

const projectId = computed(() => router.currentRoute.value.params.projectId as string);
const moduleId = computed(() => router.currentRoute.value.params.moduleId as string);

const goToCollect = () => {
  router.push(`/projects/${projectId.value}/modules/${moduleId.value}/collect`);
};
</script>

<template>
  <div class="raw-requirement-history-view">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button>
      <h2 class="page-title">原始需求列表（历史）</h2>
    </div>

    <div class="redirect-card">
      <div class="card-icon">📋</div>
      <h3>新版需求收集工作台已上线</h3>
      <p>新版本提供了更强大的 AI 辅助需求收集功能，包括：</p>
      <ul>
        <li>多轮对话式需求收集</li>
        <li>自动生成追问问题</li>
        <li>实时需求分析和摘要</li>
        <li>冲突检测和关联分析</li>
      </ul>
      <el-button type="primary" :icon="MagicStick" size="large" @click="goToCollect">
        前往新版需求收集工作台
      </el-button>
    </div>

    <div class="old-content">
      <el-alert type="info" :closable="false">
        <template #title>
          旧版页面说明
        </template>
        当前页面为历史记录查看页面，用于查看已收集的原始需求。
        如需进行新的需求收集，请使用上方的新版需求收集工作台。
      </el-alert>
    </div>
  </div>
</template>

<style scoped>
.raw-requirement-history-view {
  padding: 24px;
  max-width: 800px;
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
  color: #303133;
  margin: 0;
}

.redirect-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  color: white;
  margin-bottom: 24px;
}

.card-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.redirect-card h3 {
  font-size: 24px;
  margin: 0 0 16px;
}

.redirect-card p {
  margin: 0 0 12px;
  opacity: 0.9;
}

.redirect-card ul {
  text-align: left;
  max-width: 300px;
  margin: 0 auto 24px;
  padding-left: 24px;
}

.redirect-card li {
  margin-bottom: 8px;
}

.redirect-card .el-button {
  background: white;
  color: #667eea;
  border: none;
  font-weight: 600;
}

.redirect-card .el-button:hover {
  background: #f0f0f0;
}

.old-content {
  margin-top: 24px;
}
</style>
