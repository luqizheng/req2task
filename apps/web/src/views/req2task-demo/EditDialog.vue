<script setup lang="ts">
import type { Project, RawRequirement, Requirement, Module, Task } from './types';

const props = defineProps<{
  visible: boolean;
  currentItem: any;
  editType: string;
  modules: Module[];
  projects: Project[];
}>();

const emit = defineEmits<{
  close: [];
  save: [];
  'update:currentItem': [value: any];
}>();

const handleClose = () => {
  emit('close');
};

const handleSave = () => {
  emit('save');
};
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="currentItem ? '编辑' + ({ 
      project: '项目',
      rawRequirement: '原始需求',
      requirement: '需求',
      module: '模块',
      task: '任务'
    })[editType] : '新建' + ({ 
      project: '项目',
      rawRequirement: '原始需求',
      requirement: '需求',
      module: '模块',
      task: '任务'
    })[editType]"
    width="600px"
    @close="handleClose"
  >
    <el-form :model="currentItem || {}" label-width="80px">
      <!-- 项目表单 -->
      <template v-if="editType === 'project'">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="currentItem.name" placeholder="请输入项目名称"></el-input>
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input v-model="currentItem.description" type="textarea" placeholder="请输入项目描述"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="currentItem.status" placeholder="请选择状态">
            <el-option label="规划中" value="规划中" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="currentItem.startDate" type="date" placeholder="选择开始日期"></el-date-picker>
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="currentItem.endDate" type="date" placeholder="选择结束日期"></el-date-picker>
        </el-form-item>
        <el-form-item label="进度" prop="progress">
          <el-slider v-model="currentItem.progress" :min="0" :max="100"></el-slider>
        </el-form-item>
      </template>

      <!-- 原始需求表单 -->
      <template v-else-if="editType === 'rawRequirement'">
        <el-form-item label="需求标题" prop="title">
          <el-input v-model="currentItem.title" placeholder="请输入需求标题"></el-input>
        </el-form-item>
        <el-form-item label="需求描述" prop="description">
          <el-input v-model="currentItem.description" type="textarea" placeholder="请输入需求描述"></el-input>
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-input v-model="currentItem.source" placeholder="请输入需求来源"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="currentItem.status" placeholder="请选择状态">
            <el-option label="待分析" value="待分析" />
            <el-option label="分析中" value="分析中" />
            <el-option label="已分析" value="已分析" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="currentItem.priority" placeholder="请选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 需求表单 -->
      <template v-else-if="editType === 'requirement'">
        <el-form-item label="需求标题" prop="title">
          <el-input v-model="currentItem.title" placeholder="请输入需求标题"></el-input>
        </el-form-item>
        <el-form-item label="需求描述" prop="description">
          <el-input v-model="currentItem.description" type="textarea" placeholder="请输入需求描述"></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="currentItem.type" placeholder="请选择类型">
            <el-option label="功能需求" value="功能需求" />
            <el-option label="非功能需求" value="非功能需求" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="currentItem.status" placeholder="请选择状态">
            <el-option label="待批准" value="待批准" />
            <el-option label="已批准" value="已批准" />
            <el-option label="开发中" value="开发中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="currentItem.priority" placeholder="请选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-select v-model="currentItem.module" placeholder="请选择所属模块">
            <el-option v-for="module in modules" :key="module.id" :label="module.name" :value="module.name" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 模块表单 -->
      <template v-else-if="editType === 'module'">
        <el-form-item label="模块名称" prop="name">
          <el-input v-model="currentItem.name" placeholder="请输入模块名称"></el-input>
        </el-form-item>
        <el-form-item label="模块描述" prop="description">
          <el-input v-model="currentItem.description" type="textarea" placeholder="请输入模块描述"></el-input>
        </el-form-item>
        <el-form-item label="项目ID" prop="projectId">
          <el-select v-model="currentItem.projectId" placeholder="请选择项目">
            <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="currentItem.status" placeholder="请选择状态">
            <el-option label="待开发" value="待开发" />
            <el-option label="开发中" value="开发中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度" prop="progress">
          <el-slider v-model="currentItem.progress" :min="0" :max="100"></el-slider>
        </el-form-item>
      </template>

      <!-- 任务表单 -->
      <template v-else-if="editType === 'task'">
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="currentItem.title" placeholder="请输入任务标题"></el-input>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="currentItem.description" type="textarea" placeholder="请输入任务描述"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="currentItem.status" placeholder="请选择状态">
            <el-option label="待分配" value="待分配" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="currentItem.assignee" placeholder="请输入负责人"></el-input>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="currentItem.priority" placeholder="请选择优先级">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker v-model="currentItem.deadline" type="date" placeholder="选择截止日期"></el-date-picker>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>
