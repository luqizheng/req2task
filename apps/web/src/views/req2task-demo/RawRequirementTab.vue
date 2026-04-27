<script setup lang="ts">
import { View, Edit, Delete } from '@element-plus/icons-vue';
import type { RawRequirement } from './types';

defineProps<{
  rawRequirements: RawRequirement[];
}>();

const emit = defineEmits<{
  openEditDialog: [type: string, item?: RawRequirement];
}>();
</script>

<template>
  <div class="card-grid">
    <el-card
      v-for="req in rawRequirements"
      :key="req.id"
      shadow="hover"
      class="demo-card"
    >
      <template #header>
        <div class="card-header">
          <span>{{ req.title }}</span>
          <div class="card-actions">
            <el-button type="text" :icon="View" @click="emit('openEditDialog', 'rawRequirement', req)">查看</el-button>
            <el-button type="text" :icon="Edit" @click="emit('openEditDialog', 'rawRequirement', req)">编辑</el-button>
            <el-button type="text" :icon="Delete" danger>删除</el-button>
          </div>
        </div>
      </template>
      <div class="card-content">
        <p class="card-description">{{ req.description }}</p>
        <div class="card-meta">
          <span class="meta-item">
            <el-tag :type="req.status === '待分析' ? 'warning' : req.status === '分析中' ? 'info' : 'success'">
              {{ req.status }}
            </el-tag>
          </span>
          <span class="meta-item">
            <el-tag :type="req.priority === '高' ? 'danger' : req.priority === '中' ? 'warning' : 'success'">
              {{ req.priority }}
            </el-tag>
          </span>
          <span class="meta-item">来源: {{ req.source }}</span>
        </div>
      </div>
    </el-card>
  </div>

  <!-- 原始需求列表 -->
  <el-card shadow="hover" class="list-card">
    <template #header>
      <div class="card-header">
        <span>原始需求列表</span>
      </div>
    </template>
    <el-table :data="rawRequirements" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="需求标题" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === '待分析' ? 'warning' : scope.row.status === '分析中' ? 'info' : 'success'">
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
      <el-table-column prop="source" label="来源" width="150" />
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" :icon="View" @click="emit('openEditDialog', 'rawRequirement', scope.row)">查看</el-button>
          <el-button size="small" :icon="Edit" @click="emit('openEditDialog', 'rawRequirement', scope.row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
