<script setup lang="ts">
import { Download } from '@element-plus/icons-vue';
import type { RequirementAnalysis } from './types';

const props = defineProps<{
  requirementAnalysis: RequirementAnalysis;
}>();
</script>

<template>
  <el-card shadow="hover" class="analysis-card">
    <template #header>
      <div class="card-header">
        <span>需求分析报告</span>
        <el-button type="primary" :icon="Download">导出报告</el-button>
      </div>
    </template>
    
    <div class="analysis-content">
      <div class="analysis-header">
        <h2>{{ requirementAnalysis.projectName }} - 需求分析报告</h2>
        <div class="analysis-meta">
          <span>分析日期: {{ requirementAnalysis.analysisDate }}</span>
          <span>分析师: {{ requirementAnalysis.analyst }}</span>
        </div>
      </div>

      <div class="analysis-section">
        <h3>1. 项目概述</h3>
        <p>{{ requirementAnalysis.summary }}</p>
      </div>

      <div class="analysis-section">
        <h3>2. 功能需求</h3>
        <el-table :data="requirementAnalysis.functionalRequirements" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="需求名称" />
          <el-table-column prop="description" label="需求描述" />
          <el-table-column prop="priority" label="优先级" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.priority === '高' ? 'danger' : scope.row.priority === '中' ? 'warning' : 'success'">
                {{ scope.row.priority }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="analysis-section">
        <h3>3. 非功能需求</h3>
        <el-table :data="requirementAnalysis.nonFunctionalRequirements" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="需求名称" />
          <el-table-column prop="description" label="需求描述" />
          <el-table-column prop="priority" label="优先级" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.priority === '高' ? 'danger' : scope.row.priority === '中' ? 'warning' : 'success'">
                {{ scope.row.priority }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="analysis-section">
        <h3>4. 风险分析</h3>
        <el-table :data="requirementAnalysis.risks" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="description" label="风险描述" />
          <el-table-column prop="mitigation" label="缓解措施" />
        </el-table>
      </div>

      <div class="analysis-section">
        <h3>5. 结论与建议</h3>
        <ul>
          <li>本项目需求明确，功能模块划分合理</li>
          <li>建议优先开发高优先级的功能需求</li>
          <li>建议建立完善的需求变更管理流程</li>
          <li>建议进行技术预研，降低技术风险</li>
        </ul>
      </div>
    </div>
  </el-card>
</template>
