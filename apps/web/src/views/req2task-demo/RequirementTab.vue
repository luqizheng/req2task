<script setup lang="ts">
import { View, Edit, Delete } from '@element-plus/icons-vue';
import type { Requirement } from './types';

const props = defineProps<{
  requirements: Requirement[];
}>();

const emit = defineEmits<{
  openEditDialog: [type: string, item?: Requirement];
}>();
</script>

<template>
  <div class="card-grid">
    <el-card
      v-for="req in requirements"
      :key="req.id"
      shadow="hover"
      class="demo-card"
    >
      <template #header>
        <div class="card-header">
          <span>{{ req.title }}</span>
          <div class="card-actions">
            <el-button type="text" :icon="View" @click="emit('openEditDialog', 'requirement', req)">查看</el-button>
            <el-button type="text" :icon="Edit" @click="emit('openEditDialog', 'requirement', req)">编辑</el-button>
            <el-button type="text" :icon="Delete" danger>删除</el-button>
          </div>
        </div>
      </template>
      <div class="card-content">
        <p class="card-description">{{ req.description }}</p>
        <div class="card-meta">
          <span class="meta-item">
            <el-tag :type="req.status === '已批准' ? 'success' : req.status === '开发中' ? 'info' : 'warning'">
              {{ req.status }}
            </el-tag>
          </span>
          <span class="meta-item">
            <el-tag :type="req.priority === '高' ? 'danger' : req.priority === '中' ? 'warning' : 'success'">
              {{ req.priority }}
            </el-tag>
          </span>
          <span class="meta-item">类型: {{ req.type }}</span>
          <span class="meta-item">模块: {{ req.module }}</span>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 需求列表 -->
  <el-card shadow="hover" class="list-card">
    <template #header>
      <div class="card-header">
        <span>需求列表</span>
      </div>
    </template>
    <el-table :data="requirements" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="需求标题" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.type === '功能需求' ? 'success' : 'info'">
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '已批准' ? 'success' : scope.row.status === '开发中' ? 'info' : 'warning'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.priority === '高' ? 'danger' : scope.row.priority === '中' ? 'warning' : 'success'">
            {{ scope.row.priority }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="所属模块" width="150" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" :icon="View" @click="emit('openEditDialog', 'requirement', scope.row)">查看</el-button>
          <el-button size="small" :icon="Edit" @click="emit('openEditDialog', 'requirement', scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
