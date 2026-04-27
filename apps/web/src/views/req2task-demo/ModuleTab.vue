<script setup lang="ts">
import { View, Edit, Delete } from '@element-plus/icons-vue';
import type { Module } from './types';

const props = defineProps<{
  modules: Module[];
}>();

const emit = defineEmits<{
  openEditDialog: [type: string, item?: Module];
}>();
</script>

<template>
  <div class="card-grid">
    <el-card
      v-for="module in modules"
      :key="module.id"
      shadow="hover"
      class="demo-card"
    >
      <template #header>
        <div class="card-header">
          <span>{{ module.name }}</span>
          <div class="card-actions">
            <el-button type="text" :icon="View" @click="emit('openEditDialog', 'module', module)">查看</el-button>
            <el-button type="text" :icon="Edit" @click="emit('openEditDialog', 'module', module)">编辑</el-button>
            <el-button type="text" :icon="Delete" danger>删除</el-button>
          </div>
        </div>
      </template>
      <div class="card-content">
        <p class="card-description">{{ module.description }}</p>
        <el-progress :percentage="module.progress" :color="module.progress === 100 ? '#67C23A' : '#409EFF'" />
        <div class="card-meta">
          <span class="meta-item">
            <el-tag :type="module.status === '开发中' ? 'success' : module.status === '待开发' ? 'warning' : 'info'">
              {{ module.status }}
            </el-tag>
          </span>
          <span class="meta-item">项目ID: {{ module.projectId }}</span>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 模块列表 -->
  <el-card shadow="hover" class="list-card">
    <template #header>
      <div class="card-header">
        <span>模块列表</span>
      </div>
    </template>
    <el-table :data="modules" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="模块名称" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '开发中' ? 'success' : scope.row.status === '待开发' ? 'warning' : 'info'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="150">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" :color="scope.row.progress === 100 ? '#67C23A' : '#409EFF'" :show-text="true" />
        </template>
      </el-table-column>
      <el-table-column prop="projectId" label="项目ID" width="120" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" :icon="View" @click="emit('openEditDialog', 'module', scope.row)">查看</el-button>
          <el-button size="small" :icon="Edit" @click="emit('openEditDialog', 'module', scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
