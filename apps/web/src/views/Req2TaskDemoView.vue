<script setup lang="ts">
import { Plus, Refresh, Download, Filter } from '@element-plus/icons-vue';
import ViewContainer from '@/components/view-container.vue';
import ViewToolbar from '@/components/view-toolbar.vue';

import ProjectTab from './req2task-demo/ProjectTab.vue';
import RawRequirementTab from './req2task-demo/RawRequirementTab.vue';
import RequirementTab from './req2task-demo/RequirementTab.vue';
import ModuleTab from './req2task-demo/ModuleTab.vue';
import TaskTab from './req2task-demo/TaskTab.vue';
import AnalysisTab from './req2task-demo/AnalysisTab.vue';
import UploadTab from './req2task-demo/UploadTab.vue';
import EditDialog from './req2task-demo/EditDialog.vue';

import { useReq2TaskDemo } from './req2task-demo/useReq2TaskDemo';
import './req2task-demo/styles.css';

const {
  activeTab,
  demoFileIds,
  demoTargetType,
  demoTargetId,
  handleUploadComplete,
  handleRemoveFile,
  projects,
  rawRequirements,
  requirements,
  modules,
  tasks,
  requirementAnalysis,
  editDialogVisible,
  currentItem,
  editType,
  openEditDialog,
  closeEditDialog,
  saveItem
} = useReq2TaskDemo();
</script>

<template>
  <ViewContainer title="Req2Task 演示平台">
    <ViewToolbar>
      <div class="toolbar-actions">
        <el-button type="primary" :icon="Plus" @click="openEditDialog(activeTab)">
          新建
        </el-button>
        <el-button :icon="Refresh">刷新</el-button>
        <el-button :icon="Download">导出</el-button>
      </div>
      <div class="toolbar-search">
        <el-input
          placeholder="搜索..."
          prefix-icon="Search"
          style="width: 240px;"
        />
        <el-button :icon="Filter" style="margin-left: 10px;">筛选</el-button>
      </div>
    </ViewToolbar>

    <div class="demo-container">
      <el-tabs v-model="activeTab" type="card" class="demo-tabs">
        <el-tab-pane label="项目管理" name="project">
          <ProjectTab :projects="projects" @open-edit-dialog="openEditDialog" />
        </el-tab-pane>

        <el-tab-pane label="原始需求" name="rawRequirement">
          <RawRequirementTab :rawRequirements="rawRequirements" @open-edit-dialog="openEditDialog" />
        </el-tab-pane>

        <el-tab-pane label="需求管理" name="requirement">
          <RequirementTab :requirements="requirements" @open-edit-dialog="openEditDialog" />
        </el-tab-pane>

        <el-tab-pane label="模块管理" name="module">
          <ModuleTab :modules="modules" @open-edit-dialog="openEditDialog" />
        </el-tab-pane>

        <el-tab-pane label="任务管理" name="task">
          <TaskTab :tasks="tasks" @open-edit-dialog="openEditDialog" />
        </el-tab-pane>

        <el-tab-pane label="需求分析" name="analysis">
          <AnalysisTab :requirementAnalysis="requirementAnalysis" />
        </el-tab-pane>

        <el-tab-pane label="文件上传" name="upload">
          <UploadTab
            v-model:demoFileIds="demoFileIds"
            v-model:demoTargetType="demoTargetType"
            v-model:demoTargetId="demoTargetId"
            @handle-upload-complete="handleUploadComplete"
            @handle-remove-file="handleRemoveFile"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <EditDialog
      v-model:visible="editDialogVisible"
      v-model:currentItem="currentItem"
      :editType="editType"
      :modules="modules"
      :projects="projects"
      @close="closeEditDialog"
      @save="saveItem"
    />
  </ViewContainer>
</template>
