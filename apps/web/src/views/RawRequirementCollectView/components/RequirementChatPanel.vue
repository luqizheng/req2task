<script setup lang="ts">
import { ref } from "vue";
import { FolderOpened, Upload, Paperclip } from "@element-plus/icons-vue";
import { useRequirementCollectStore } from "@/stores/requirementCollect";
import { ElMessage } from "element-plus";

const store = useRequirementCollectStore();

const requirementContent = ref("");
const isSubmitting = ref(false);

const hasValidCollection = ref(!!store.currentCollection?.id);

async function handleSubmit() {
  const content = requirementContent.value.trim();
  if (!content) {
    ElMessage.warning("请输入需求内容");
    return;
  }

  if (!store.currentCollection) {
    ElMessage.warning("请先选择或创建需求收集");
    return;
  }

  isSubmitting.value = true;
  try {
    const result = await store.addRequirement(content, "手动添加");
    if (result) {
      requirementContent.value = "";
      ElMessage.success("需求添加成功");
    }
  } catch {
    ElMessage.error("添加需求失败");
  } finally {
    isSubmitting.value = false;
  }
}

function handleRequirementFileUpload() {
  ElMessage.info("需求文件上传功能开发中");
}

function handleAttachmentUpload() {
  ElMessage.info("项目附件上传功能开发中");
}
</script>

<template>
  <div class="requirement-chat-panel">
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">📝</span>
        <span>需求输入</span>
      </div>
    </div>

    <template v-if="hasValidCollection">
      <div class="panel-content">
        <div class="textarea-section">
          <el-input
            v-model="requirementContent"
            type="textarea"
            placeholder="请输入原始需求内容..."
            :rows="8"
            resize="vertical"
          />
        </div>

        <div class="upload-section">
          <el-button
            type="primary"
            plain
            :icon="Upload"
            @click="handleRequirementFileUpload"
          >
            需求文件上传
          </el-button>
          <el-button
            type="info"
            plain
            :icon="Paperclip"
            @click="handleAttachmentUpload"
          >
            项目附件上传
          </el-button>
        </div>

        <div class="submit-section">
          <el-button
            type="primary"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            提交需求
          </el-button>
        </div>
      </div>
    </template>

    <div v-else class="no-collection-hint">
      <el-icon class="hint-icon"><FolderOpened /></el-icon>
      <p>请先选择或创建需求收集</p>
    </div>
  </div>
</template>

<style scoped>
.requirement-chat-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
}

.panel-header {
  padding: 14px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-icon {
  font-size: 20px;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
}

.textarea-section {
  flex: 1;
  min-height: 200px;
}

.textarea-section :deep(.el-textarea__inner) {
  height: 100%;
}

.upload-section {
  display: flex;
  gap: 12px;
}

.submit-section {
  display: flex;
  justify-content: flex-end;
}

.no-collection-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.hint-icon {
  font-size: 48px;
  color: var(--el-text-color-placeholder);
}
</style>
