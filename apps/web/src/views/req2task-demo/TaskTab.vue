<script setup lang="ts">
import { View, Edit, Delete, User, Calendar } from '@element-plus/icons-vue';
import type { Task } from './types';

defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  openEditDialog: [type: string, item?: Task];
}>();
</script>

<template>
  <div class="card-grid">
    <el-card
      v-for="task in tasks"
      :key="task.id"
      shadow="hover"
      class="demo-card"
    >
      <template #header>
        <div class="card-header">
          <span>{{ task.title }}</span>
          <div class="card-actions">
            <el-button type="text" :icon="View" @click="emit('openEditDialog', 'task', task)">查看</el-button>
            <el-button type="text" :icon="Edit" @click="emit('openEditDialog', 'task', task)">编辑</el-button>
            <el-button type="text" :icon="Delete" danger>删除</el-button>
          </div>
        </div>
      </template>
      <div class="card-content">
        <p class="card-description">{{ task.description }}</p>
        <div class="card-meta">
          <span class="meta-item">
            <el-tag :type="task.status === '已完成' ? 'success' : task.status === '进行中' ? 'info' : 'warning'">
              {{ task.status }}
            </el-tag>
          </span>
          <span class="meta-item">
            <el-tag :type="task.priority === '高' ? 'danger' : task.priority === '中' ? 'warning' : 'success'">
              {{ task.priority }}
            </el-tag>
          </span>
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ task.assignee || '未分配' }}
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ task.deadline }}
          </span>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 任务列表 -->
  <el-card shadow="hover" class="list-card">
    <template #header>
      <div class="card-header">
        <span>任务列表</span>
      </div>
    </template>
    <el-table :data="tasks" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="任务标题" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '已完成' ? 'success' : scope.row.status === '进行中' ? 'info' : 'warning'">
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
      <el-table-column prop="assignee" label="负责人" width="150">
        <template #default="scope">
          {{ scope.row.assignee || '未分配' }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" width="150" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" :icon="View" @click="emit('openEditDialog', 'task', scope.row)">查看</el-button>
          <el-button size="small" :icon="Edit" @click="emit('openEditDialog', 'task', scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
