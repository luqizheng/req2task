<script setup lang="ts">
import { Plus, Download, Upload } from '@element-plus/icons-vue';
import ViewContainer from '@/components/view-container.vue';
import ViewToolbar from '@/components/view-toolbar.vue';
import AppButton from '@/components/common/AppButton.vue';
</script>

<template>
  <div class="demo-page">
    <ViewContainer
      title="需求详情"
      subtitle="REQ-2024-001 - 用户登录功能"
      show-back
    >
      <template #toolbar>
        <ViewToolbar gap="small">
          <el-button :icon="Plus" text>
            新建
          </el-button>
          <el-button :icon="Upload" text>
            导入
          </el-button>
        </ViewToolbar>
      </template>

      <template #actions>
        <AppButton type="primary">
          保存
        </AppButton>
        <el-button :icon="Download">
          导出
        </el-button>
      </template>

      <div class="page-content">
        <p>页面内容区域</p>
      </div>
    </ViewContainer>
  </div>
</template>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: #f1f5f9;
}

.page-content {
  padding: 24px;
}
</style>
