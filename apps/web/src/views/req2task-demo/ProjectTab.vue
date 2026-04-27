<script setup lang="ts">
import { View, Edit, Delete } from '@element-plus/icons-vue';
import type { Project } from './types';

defineProps<{
  projects: Project[];
}>();

const emit = defineEmits<{
  openEditDialog: [type: string, item?: Project];
}>();
</script>

<template>
  <div class="card-grid">
    <el-card
      v-for="project in projects"
      :key="project.id"
      shadow="hover"
      class="demo-card"
    >
      <template #header>
        <div class="card-header">
          <span>{{ project.name }}</span>
          <div class="card-actions">
            <el-button type="text" :icon="View" @click="emit('openEditDialog', 'project', project)">查看</el-button>
            <el-button type="text" :icon="Edit" @click="emit('openEditDialog', 'project', project)">编辑</el-button>
            <el-button type="text" :icon="Delete" danger>删除</el-button>
          </div>
        </div>
      </template>
      <div class="card-content">
        <p class="card-description">{{ project.description }}</p>
        <el-progress :percentage="project.progress" :color="project.progress === 100 ? '#67C23A' : '#409EFF'" />
        <div class="card-meta">
          <span class="meta-item">
            <el-tag :type="project.status === '进行中' ? 'success' : project.status === '规划中' ? 'warning' : 'info'">
              {{ project.status }}
            </el-tag>
          </span>
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            {{ project.startDate }} 至 {{ project.endDate }}
          </span>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 项目列表 -->
  <el-card shadow="hover" class="list-card">
    <template #header>
      <div class="card-header">
        <span>项目列表</span>
      </div>
    </template>
    <el-table :data="projects" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="项目名称" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '进行中' ? 'success' : scope.row.status === '规划中' ? 'warning' : 'info'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="150">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" :color="scope.row.progress === 100 ? '#67C23A' : '#409EFF'" :show-text="true" />
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="150" />
      <el-table-column prop="endDate" label="结束日期" width="150" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" :icon="View" @click="emit('openEditDialog', 'project', scope.row)">查看</el-button>
          <el-button size="small" :icon="Edit" @click="emit('openEditDialog', 'project', scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
