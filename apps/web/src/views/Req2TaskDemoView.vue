<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Plus, Edit, Delete, View, Filter, Refresh, Download, 
  Calendar, User 
} from '@element-plus/icons-vue';
import ViewContainer from '@/components/view-container.vue';

import ViewToolbar from '@/components/view-toolbar.vue';

// 类型定义
interface Project {
  id: number;
  name: string;
  description: string;
  status: '规划中' | '进行中' | '已完成';
  startDate: string;
  endDate: string;
  progress: number;
}

interface RawRequirement {
  id: number;
  title: string;
  description: string;
  source: string;
  status: '待分析' | '分析中' | '已分析';
  priority: '高' | '中' | '低';
}

interface Requirement {
  id: number;
  title: string;
  description: string;
  status: '待批准' | '已批准' | '开发中' | '已完成' | '待开发';
  priority: '高' | '中' | '低';
  type: '功能需求' | '非功能需求';
  module: string;
}

interface Module {
  id: number;
  name: string;
  description: string;
  projectId: number;
  status: '待开发' | '开发中' | '已完成';
  progress: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: '待分配' | '进行中' | '已完成';
  assignee: string;
  priority: '高' | '中' | '低';
  deadline: string;
}

interface AnalysisItem {
  id: number;
  title: string;
  description: string;
  priority?: '高' | '中' | '低';
}

interface Risk {
  id: number;
  description: string;
  mitigation: string;
}

interface RequirementAnalysis {
  projectName: string;
  analysisDate: string;
  analyst: string;
  summary: string;
  functionalRequirements: AnalysisItem[];
  nonFunctionalRequirements: AnalysisItem[];
  risks: Risk[];
}

const activeTab = ref('project');

// 项目数据
const projects = ref<Project[]>([
  { id: 1, name: '电商平台重构', description: '基于Vue 3和NestJS的电商平台重构项目', status: '进行中', startDate: '2024-01-15', endDate: '2024-06-30', progress: 65 },
  { id: 2, name: '智能办公系统', description: '集成AI助手的企业办公自动化系统', status: '规划中', startDate: '2024-03-01', endDate: '2024-09-30', progress: 10 },
  { id: 3, name: '移动应用开发', description: '跨平台移动应用开发项目', status: '已完成', startDate: '2023-09-01', endDate: '2024-02-28', progress: 100 },
]);

// 原始需求数据
const rawRequirements = ref<RawRequirement[]>([
  { id: 1, title: '用户登录功能', description: '实现用户登录、注册、忘记密码功能', source: '客户需求文档', status: '待分析', priority: '高' },
  { id: 2, title: '商品搜索功能', description: '实现商品关键词搜索、分类筛选、排序功能', source: '产品经理', status: '分析中', priority: '中' },
  { id: 3, title: '购物车功能', description: '实现商品添加、删除、数量修改、结算功能', source: '用户反馈', status: '已分析', priority: '高' },
]);

// 需求数据
const requirements = ref<Requirement[]>([
  { id: 1, title: '用户认证模块', description: '实现基于JWT的用户认证系统', status: '已批准', priority: '高', type: '功能需求', module: '用户管理' },
  { id: 2, title: '商品管理功能', description: '实现商品的CRUD操作和库存管理', status: '开发中', priority: '中', type: '功能需求', module: '商品管理' },
  { id: 3, title: '系统性能优化', description: '优化系统响应速度和并发处理能力', status: '待开发', priority: '中', type: '非功能需求', module: '系统架构' },
]);

// 模块数据
const modules = ref<Module[]>([
  { id: 1, name: '用户管理', description: '用户认证、权限管理、个人信息', projectId: 1, status: '开发中', progress: 75 },
  { id: 2, name: '商品管理', description: '商品信息、分类、库存管理', projectId: 1, status: '开发中', progress: 60 },
  { id: 3, name: '订单管理', description: '订单创建、支付、物流跟踪', projectId: 1, status: '待开发', progress: 0 },
]);

// 任务数据
const tasks = ref<Task[]>([
  { id: 1, title: '用户登录页面开发', description: '开发用户登录页面UI和交互', status: '已完成', assignee: '张三', priority: '高', deadline: '2024-02-15' },
  { id: 2, title: '商品列表API开发', description: '开发商品列表查询接口', status: '进行中', assignee: '李四', priority: '中', deadline: '2024-02-28' },
  { id: 3, title: '购物车逻辑实现', description: '实现购物车的添加、删除、更新功能', status: '待分配', assignee: '', priority: '高', deadline: '2024-03-15' },
]);

// 需求分析数据
const requirementAnalysis = ref<RequirementAnalysis>({
  projectName: '电商平台重构',
  analysisDate: '2024-02-20',
  analyst: '王五',
  summary: '本需求分析基于客户提供的需求文档和产品经理的补充说明，涵盖了用户认证、商品管理、订单处理等核心功能模块。',
  functionalRequirements: [
    { id: 1, title: '用户认证', description: '实现用户注册、登录、忘记密码功能', priority: '高' },
    { id: 2, title: '商品浏览', description: '实现商品列表、详情、搜索功能', priority: '高' },
    { id: 3, title: '购物车', description: '实现商品添加、删除、结算功能', priority: '中' },
  ],
  nonFunctionalRequirements: [
    { id: 1, title: '性能要求', description: '系统响应时间不超过2秒', priority: '高' },
    { id: 2, title: '安全要求', description: '数据传输采用HTTPS加密', priority: '高' },
    { id: 3, title: '兼容性', description: '支持主流浏览器和移动设备', priority: '中' },
  ],
  risks: [
    { id: 1, description: '需求变更可能导致项目延期', mitigation: '建立变更管理流程' },
    { id: 2, description: '技术选型风险', mitigation: '进行技术预研和原型开发' },
  ],
});

// 编辑状态
const editDialogVisible = ref(false);
const currentItem = ref<any>(null);
const editType = ref<string>('');

const openEditDialog = (type: string, item?: any) => {
  editType.value = type;
  currentItem.value = item ? { ...item } : null;
  editDialogVisible.value = true;
};

const closeEditDialog = () => {
  editDialogVisible.value = false;
  currentItem.value = null;
};

const saveItem = () => {
  // 模拟保存逻辑
  console.log('保存', editType.value, currentItem.value);
  ElMessage.success('保存成功');
  closeEditDialog();
};
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
      <!-- 标签页 -->
      <el-tabs v-model="activeTab" type="card" class="demo-tabs">
        <!-- 项目管理 -->
        <el-tab-pane label="项目管理" name="project">
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
                    <el-button type="text" :icon="View" @click="openEditDialog('project', project)">查看</el-button>
                    <el-button type="text" :icon="Edit" @click="openEditDialog('project', project)">编辑</el-button>
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
                  <el-button type="primary" size="small" :icon="View" @click="openEditDialog('project', scope.row)">查看</el-button>
                  <el-button size="small" :icon="Edit" @click="openEditDialog('project', scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 原始需求 -->
        <el-tab-pane label="原始需求" name="rawRequirement">
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
                    <el-button type="text" :icon="View" @click="openEditDialog('rawRequirement', req)">查看</el-button>
                    <el-button type="text" :icon="Edit" @click="openEditDialog('rawRequirement', req)">编辑</el-button>
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
                  <el-button type="primary" size="small" :icon="View" @click="openEditDialog('rawRequirement', scope.row)">查看</el-button>
                  <el-button size="small" :icon="Edit" @click="openEditDialog('rawRequirement', scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 需求管理 -->
        <el-tab-pane label="需求管理" name="requirement">
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
                    <el-button type="text" :icon="View" @click="openEditDialog('requirement', req)">查看</el-button>
                    <el-button type="text" :icon="Edit" @click="openEditDialog('requirement', req)">编辑</el-button>
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
                  <el-button type="primary" size="small" :icon="View" @click="openEditDialog('requirement', scope.row)">查看</el-button>
                  <el-button size="small" :icon="Edit" @click="openEditDialog('requirement', scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 模块管理 -->
        <el-tab-pane label="模块管理" name="module">
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
                    <el-button type="text" :icon="View" @click="openEditDialog('module', module)">查看</el-button>
                    <el-button type="text" :icon="Edit" @click="openEditDialog('module', module)">编辑</el-button>
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
                  <el-button type="primary" size="small" :icon="View" @click="openEditDialog('module', scope.row)">查看</el-button>
                  <el-button size="small" :icon="Edit" @click="openEditDialog('module', scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 任务管理 -->
        <el-tab-pane label="任务管理" name="task">
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
                    <el-button type="text" :icon="View" @click="openEditDialog('task', task)">查看</el-button>
                    <el-button type="text" :icon="Edit" @click="openEditDialog('task', task)">编辑</el-button>
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
                  <el-button type="primary" size="small" :icon="View" @click="openEditDialog('task', scope.row)">查看</el-button>
                  <el-button size="small" :icon="Edit" @click="openEditDialog('task', scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 需求分析呈现 -->
        <el-tab-pane label="需求分析" name="analysis">
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
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
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
    >
      <el-form :model="currentItem || {}" label-width="80px">
        <!-- 项目表单 -->
        <template v-if="editType === 'project'">
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="currentItem.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述" prop="description">
            <el-input v-model="currentItem.description" type="textarea" placeholder="请输入项目描述" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="currentItem.status" placeholder="请选择状态">
              <el-option label="规划中" value="规划中" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker v-model="currentItem.startDate" type="date" placeholder="选择开始日期" />
          </el-form-item>
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker v-model="currentItem.endDate" type="date" placeholder="选择结束日期" />
          </el-form-item>
          <el-form-item label="进度" prop="progress">
            <el-slider v-model="currentItem.progress" :min="0" :max="100" />
          </el-form-item>
        </template>

        <!-- 原始需求表单 -->
        <template v-else-if="editType === 'rawRequirement'">
          <el-form-item label="需求标题" prop="title">
            <el-input v-model="currentItem.title" placeholder="请输入需求标题" />
          </el-form-item>
          <el-form-item label="需求描述" prop="description">
            <el-input v-model="currentItem.description" type="textarea" placeholder="请输入需求描述" />
          </el-form-item>
          <el-form-item label="来源" prop="source">
            <el-input v-model="currentItem.source" placeholder="请输入需求来源" />
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
            <el-input v-model="currentItem.title" placeholder="请输入需求标题" />
          </el-form-item>
          <el-form-item label="需求描述" prop="description">
            <el-input v-model="currentItem.description" type="textarea" placeholder="请输入需求描述" />
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
            <el-input v-model="currentItem.name" placeholder="请输入模块名称" />
          </el-form-item>
          <el-form-item label="模块描述" prop="description">
            <el-input v-model="currentItem.description" type="textarea" placeholder="请输入模块描述" />
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
            <el-slider v-model="currentItem.progress" :min="0" :max="100" />
          </el-form-item>
        </template>

        <!-- 任务表单 -->
        <template v-else-if="editType === 'task'">
          <el-form-item label="任务标题" prop="title">
            <el-input v-model="currentItem.title" placeholder="请输入任务标题" />
          </el-form-item>
          <el-form-item label="任务描述" prop="description">
            <el-input v-model="currentItem.description" type="textarea" placeholder="请输入任务描述" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="currentItem.status" placeholder="请选择状态">
              <el-option label="待分配" value="待分配" />
              <el-option label="进行中" value="进行中" />
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
          <el-form-item label="负责人" prop="assignee">
            <el-input v-model="currentItem.assignee" placeholder="请输入负责人" />
          </el-form-item>
          <el-form-item label="截止日期" prop="deadline">
            <el-date-picker v-model="currentItem.deadline" type="date" placeholder="选择截止日期" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeEditDialog">取消</el-button>
          <el-button type="primary" @click="saveItem">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </ViewContainer>
</template>

<style scoped>
.demo-container {
  padding: 20px;
}

.demo-tabs {
  margin-bottom: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.demo-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 10px 0;
}

.card-description {
  margin-bottom: 15px;
  color: #606266;
  line-height: 1.5;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.list-card {
  margin-bottom: 20px;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.toolbar-search {
  display: flex;
  align-items: center;
}

.analysis-card {
  margin-bottom: 20px;
}

.analysis-content {
  padding: 20px 0;
}

.analysis-header {
  margin-bottom: 30px;
  text-align: center;
}

.analysis-header h2 {
  margin-bottom: 10px;
  color: #303133;
}

.analysis-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  color: #606266;
}

.analysis-section {
  margin-bottom: 30px;
}

.analysis-section h3 {
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.analysis-section p {
  line-height: 1.6;
  color: #606266;
}

.analysis-section ul {
  padding-left: 20px;
  color: #606266;
}

.analysis-section li {
  margin-bottom: 8px;
  line-height: 1.6;
}
</style>