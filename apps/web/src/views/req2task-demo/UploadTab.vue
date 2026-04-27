<script setup lang="ts">
import { ref } from 'vue';
import { RustFSUploader } from '@/components/common';

const props = defineProps<{
  demoFileIds: string[];
  demoTargetType: 'collection' | 'raw_requirement' | 'project';
  demoTargetId: string;
}>();

const emit = defineEmits<{
  'update:demoFileIds': [value: string[]];
  'update:demoTargetType': [value: 'collection' | 'raw_requirement' | 'project'];
  'update:demoTargetId': [value: string];
  handleUploadComplete: [fileIds: string[]];
  handleRemoveFile: [fileId: string];
}>();

const localTargetType = ref(props.demoTargetType);
const localTargetId = ref(props.demoTargetId);
const localFileIds = ref([...props.demoFileIds]);

const handleTargetTypeChange = (value: 'collection' | 'raw_requirement' | 'project') => {
  localTargetType.value = value;
  emit('update:demoTargetType', value);
};

const handleTargetIdInput = (value: string) => {
  localTargetId.value = value;
  emit('update:demoTargetId', value);
};

const handleFileIdsChange = (value: string[]) => {
  localFileIds.value = value;
  emit('update:demoFileIds', value);
};
</script>

<template>
  <el-card shadow="hover" class="upload-demo-card">
    <template #header>
      <div class="card-header">
        <span>RustFS 文件上传演示</span>
      </div>
    </template>
    <div class="upload-demo-content">
      <div class="demo-section">
        <h3>紧凑型多文件上传</h3>
        <p class="demo-description">演示 RustFSUploader 组件的基本使用，支持多文件上传、进度显示和删除功能。</p>
        
        <div class="demo-config">
          <el-form :inline="true" label-position="top">
            <el-form-item label="关联类型">
              <el-select v-model="localTargetType" style="width: 180px;" @change="handleTargetTypeChange">
                <el-option label="项目" value="project" />
                <el-option label="原始需求" value="raw_requirement" />
                <el-option label="集合" value="collection" />
              </el-select>
            </el-form-item>
            <el-form-item label="关联ID">
              <el-input v-model="localTargetId" placeholder="请输入关联ID" style="width: 200px;" @input="handleTargetIdInput">
                <template #prepend>ID:</template>
              </el-input>
            </el-form-item>
            <el-form-item label="已上传文件ID">
              <el-tag v-for="id in localFileIds" :key="id" size="small" class="file-id-tag">
                {{ id }}
              </el-tag>
              <span v-if="localFileIds.length === 0" class="empty-tags">无</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="upload-component-container">
          <RustFSUploader
            v-model="localFileIds"
            :target-type="localTargetType"
            :target-id="localTargetId"
            @update:model-value="handleFileIdsChange"
            @upload-complete="emit('handleUploadComplete', $event)"
            @remove="emit('handleRemoveFile', $event)"
            max-count="5"
          />
        </div>

        <div class="demo-info">
          <h4>功能特点：</h4>
          <ul>
            <li>支持多文件同时上传</li>
            <li>实时显示上传进度</li>
            <li>支持文件类型和大小限制</li>
            <li>自动关联到目标实体</li>
            <li>返回文件ID用于后续操作</li>
            <li>支持删除已上传文件</li>
          </ul>
        </div>

        <div class="demo-code">
          <h4>使用示例：</h4>
          <el-divider />
          <pre><code>{{ `&lt;RustFSUploader
  v-model="fileIds"
  :target-type="'project'"
  :target-id="'project-123'"
  @upload-complete="handleUploadComplete"
  @remove="handleRemoveFile"
  max-count="5"
/&gt;` }}</code></pre>
          <pre><code>{{ `import { ref } from 'vue';
import { RustFSUploader } from '@/components/common';

const fileIds = ref<string[]>([]);

const handleUploadComplete = (ids: string[]) => {
  console.log('上传完成:', ids);
};

const handleRemoveFile = (id: string) => {
  console.log('移除文件:', id);
};` }}</code></pre>
        </div>
      </div>
    </div>
  </el-card>
</template>
