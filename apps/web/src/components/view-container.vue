<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

defineProps<{
  title: string;
  subtitle?: string;
  showBack?: boolean;
}>();

const router = useRouter();

const handleBack = () => {
  router.back();
};
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div class="header-left">
        <el-button
          v-if="showBack"
          :icon="ArrowLeft"
          text
          class="back-button"
          @click="handleBack"
        />
        <div class="title-area">
          <h1 class="title">{{ title }}</h1>
          <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
        </div>
        <slot name="toolbar" />
      </div>

      <div class="header-right">
        <slot name="actions" />
      </div>
    </header>
    
    <div class="container-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.view-container {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  min-height: 100%;
}

.view-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.back-button {
  color: #64748b;
  font-size: 18px;
  padding: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-button:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.title-area {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.container-content {
  padding: 20px;
}

html.dark .view-header {
  background: #1e293b;
  border-bottom-color: #334155;
}

html.dark .back-button {
  color: #94a3b8;
}

html.dark .back-button:hover {
  color: #f1f5f9;
  background: #334155;
}

html.dark .title {
  color: #f1f5f9;
}

html.dark .subtitle {
  color: #94a3b8;
}
</style>
