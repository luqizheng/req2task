<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus, Download, Upload, Search, Edit, Delete, View, Setting, Bell, User, Star, Check, Close, ArrowDown,
} from '@element-plus/icons-vue';
import ViewContainer from '@/components/view-container.vue';

import ViewToolbar from '@/components/view-toolbar.vue';

const activeTab = ref('basic');
const activeCollapse = ref(['1']);
const activeSteps = ref(0);
const dateValue = ref<Date>(new Date());
const daterangeValue = ref<[Date, Date]>();
const sliderValue = ref(50);
const switchValue = ref(true);
const radioValue = ref('1');
const checkboxValue = ref(['1']);
const selectValue = ref('');
const inputTagValue = ref(['Vue', 'TypeScript']);
const rateValue = ref(3);
const colorValue = ref('#409EFF');

const form = reactive({
  name: '',
  email: '',
  region: '',
  desc: '',
});

const formRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
};

const tableData = [
  { id: 1, name: '张三', age: 28, address: '北京市朝阳区', status: 'active' },
  { id: 2, name: '李四', age: 32, address: '上海市浦东新区', status: 'inactive' },
  { id: 3, name: '王五', age: 25, address: '广州市天河区', status: 'active' },
];

const treeData = [
  {
    id: 1,
    label: '一级 1',
    children: [
      { id: 4, label: '二级 1-1', children: [{ id: 9, label: '三级 1-1-1' }] },
    ],
  },
  {
    id: 2,
    label: '一级 2',
    children: [{ id: 5, label: '二级 2-1' }, { id: 6, label: '二级 2-2' }],
  },
];

const timelineData = [
  { timestamp: '2024-01-01', title: '事件一', content: '创建项目' },
  { timestamp: '2024-01-02', title: '事件二', content: '需求评审' },
  { timestamp: '2024-01-03', title: '事件三', content: '开发启动' },
];

const dialogVisible = ref(false);
const drawerVisible = ref(false);
const loading = ref(false);

const handleClick = () => {
  ElMessage.success('操作成功');
};

const showDialog = () => {
  dialogVisible.value = true;
};

const showDrawer = () => {
  drawerVisible.value = true;
};

const showLoading = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 2000);
};
</script>

<template>
  <ViewContainer title="Element Plus 组件演示" subtitle="UI 组件评估页面" show-back>
      <template #toolbar>
        <ViewToolbar gap="small">
          <el-button :icon="Plus" text>新建</el-button>
          <el-button :icon="Upload" text>导入</el-button>
          <el-button :icon="Download" text>导出</el-button>
        </ViewToolbar>
      </template>
      <template #actions>
        <el-button type="primary" :icon="Setting">设置</el-button>
      </template>

    <el-tabs v-model="activeTab" class="demo-tabs">
      <el-tab-pane label="基础组件" name="basic">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card header="按钮 Button" shadow="hover" class="demo-card">
              <el-space wrap>
                <el-button>默认按钮</el-button>
                <el-button type="primary">主要按钮</el-button>
                <el-button type="success">成功按钮</el-button>
                <el-button type="warning">警告按钮</el-button>
                <el-button type="danger">危险按钮</el-button>
                <el-button type="info">信息按钮</el-button>
              </el-space>
              <el-divider />
              <el-space wrap>
                <el-button type="primary" plain>朴素按钮</el-button>
                <el-button type="primary" round>圆角按钮</el-button>
                <el-button type="primary" :icon="Search" circle />
                <el-button type="primary" loading>加载中</el-button>
                <el-button type="primary" disabled>禁用状态</el-button>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="标签 Tag" shadow="hover" class="demo-card">
              <el-space wrap>
                <el-tag>默认标签</el-tag>
                <el-tag type="success">成功</el-tag>
                <el-tag type="warning">警告</el-tag>
                <el-tag type="danger">危险</el-tag>
                <el-tag type="info">信息</el-tag>
                <el-tag effect="dark">深色</el-tag>
                <el-tag effect="plain">朴素</el-tag>
                <el-tag closable>可关闭</el-tag>
                <el-tag size="small">小标签</el-tag>
                <el-tag size="large">大标签</el-tag>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="徽章 Badge" shadow="hover" class="demo-card">
              <el-space :size="30">
                <el-badge :value="12" class="item">
                  <el-button :icon="Bell"></el-button>
                </el-badge>
                <el-badge :value="3" class="item">
                  <el-button :icon="User"></el-button>
                </el-badge>
                <el-badge :value="1" class="item" type="primary">
                  <el-button :icon="Star"></el-button>
                </el-badge>
                <el-badge :value="200" :max="99" class="item">
                  <el-button>评论</el-button>
                </el-badge>
                <el-badge is-dot class="item">
                  <el-button :icon="Bell"></el-button>
                </el-badge>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="头像 Avatar" shadow="hover" class="demo-card">
              <el-space wrap>
                <el-avatar :icon="User" />
                <el-avatar> User </el-avatar>
                <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <el-avatar :size="40"> U </el-avatar>
                <el-avatar :size="56"> U </el-avatar>
                <el-avatar shape="square" :size="40"> U </el-avatar>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="图标 Icon" shadow="hover" class="demo-card">
              <el-space wrap :size="20">
                <el-icon :size="24"><Edit /></el-icon>
                <el-icon :size="24"><Delete /></el-icon>
                <el-icon :size="24"><View /></el-icon>
                <el-icon :size="24"><Setting /></el-icon>
                <el-icon :size="24"><Bell /></el-icon>
                <el-icon :size="24"><User /></el-icon>
                <el-icon :size="24"><Star /></el-icon>
                <el-icon :size="24"><Check /></el-icon>
                <el-icon :size="24"><Close /></el-icon>
                <el-icon :size="24" color="#409EFF"><Search /></el-icon>
                <el-icon :size="24" color="#67C23A"><Check /></el-icon>
                <el-icon :size="24" color="#F56C6C"><Close /></el-icon>
              </el-space>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="表单组件" name="form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card header="输入框 Input" shadow="hover" class="demo-card">
              <el-space direction="vertical" fill style="width: 100%">
                <el-input v-model="form.name" placeholder="请输入内容" />
                <el-input v-model="form.name" placeholder="带图标" :prefix-icon="Search" />
                <el-input v-model="form.name" placeholder="可清空" clearable />
                <el-input v-model="form.name" type="textarea" :rows="3" placeholder="多行文本" />
                <el-input v-model="form.name" placeholder="禁用状态" disabled />
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="数字输入 InputNumber" shadow="hover" class="demo-card">
              <el-space direction="vertical" fill style="width: 100%">
                <el-input-number v-model="sliderValue" :min="0" :max="100" />
                <el-input-number v-model="sliderValue" :step="10" />
                <el-input-number v-model="sliderValue" size="small" />
                <el-input-number v-model="sliderValue" size="large" />
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="选择器 Select" shadow="hover" class="demo-card">
              <el-space direction="vertical" fill style="width: 100%">
                <el-select v-model="selectValue" placeholder="请选择" style="width: 100%">
                  <el-option label="选项一" value="1" />
                  <el-option label="选项二" value="2" />
                  <el-option label="选项三" value="3" />
                </el-select>
                <el-select v-model="selectValue" placeholder="可清空" clearable style="width: 100%">
                  <el-option label="选项一" value="1" />
                  <el-option label="选项二" value="2" />
                </el-select>
                <el-select v-model="selectValue" placeholder="禁用状态" disabled style="width: 100%">
                  <el-option label="选项一" value="1" />
                </el-select>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="标签输入 InputTag" shadow="hover" class="demo-card">
              <el-input-tag v-model="inputTagValue" placeholder="输入后按回车" style="width: 100%" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="单选框 Radio" shadow="hover" class="demo-card">
              <el-radio-group v-model="radioValue">
                <el-radio value="1">选项一</el-radio>
                <el-radio value="2">选项二</el-radio>
                <el-radio value="3">选项三</el-radio>
              </el-radio-group>
              <el-divider />
              <el-radio-group v-model="radioValue">
                <el-radio-button value="1">选项一</el-radio-button>
                <el-radio-button value="2">选项二</el-radio-button>
                <el-radio-button value="3">选项三</el-radio-button>
              </el-radio-group>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="复选框 Checkbox" shadow="hover" class="demo-card">
              <el-checkbox-group v-model="checkboxValue">
                <el-checkbox value="1">选项一</el-checkbox>
                <el-checkbox value="2">选项二</el-checkbox>
                <el-checkbox value="3">选项三</el-checkbox>
              </el-checkbox-group>
              <el-divider />
              <el-checkbox v-model="switchValue" label="单独使用" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="开关 Switch" shadow="hover" class="demo-card">
              <el-space>
                <el-switch v-model="switchValue" />
                <el-switch v-model="switchValue" active-text="开" inactive-text="关" />
                <el-switch v-model="switchValue" size="small" />
                <el-switch v-model="switchValue" size="large" />
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="滑块 Slider" shadow="hover" class="demo-card">
              <el-slider v-model="sliderValue" />
              <el-slider v-model="sliderValue" :step="10" show-stops />
              <el-slider v-model="sliderValue" range :max="100" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="日期选择 DatePicker" shadow="hover" class="demo-card">
              <el-space direction="vertical" fill style="width: 100%">
                <el-date-picker v-model="dateValue" type="date" placeholder="选择日期" style="width: 100%" />
                <el-date-picker v-model="daterangeValue" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="评分 Rate" shadow="hover" class="demo-card">
              <el-rate v-model="rateValue" />
              <el-rate v-model="rateValue" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" show-score />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="颜色选择 ColorPicker" shadow="hover" class="demo-card">
              <el-color-picker v-model="colorValue" />
              <el-color-picker v-model="colorValue" show-alpha />
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="表单 Form" shadow="hover" class="demo-card">
              <el-form :model="form" :rules="formRules" label-width="100px" style="max-width: 500px">
                <el-form-item label="名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入名称" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="地区">
                  <el-select v-model="form.region" placeholder="请选择地区" style="width: 100%">
                    <el-option label="北京" value="beijing" />
                    <el-option label="上海" value="shanghai" />
                  </el-select>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="请输入描述" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleClick">提交</el-button>
                  <el-button>取消</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="数据展示" name="data">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card header="表格 Table" shadow="hover" class="demo-card">
              <el-table :data="tableData" stripe border style="width: 100%">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="age" label="年龄" width="80" />
                <el-table-column prop="address" label="地址" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                      {{ row.status === 'active' ? '活跃' : '未激活' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default>
                    <el-button type="primary" text size="small">编辑</el-button>
                    <el-button type="danger" text size="small">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="树形控件 Tree" shadow="hover" class="demo-card">
              <el-tree :data="treeData" :props="{ label: 'label', children: 'children' }" show-checkbox default-expand-all />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="时间线 Timeline" shadow="hover" class="demo-card">
              <el-timeline>
                <el-timeline-item v-for="(item, index) in timelineData" :key="index" :timestamp="item.timestamp" placement="top">
                  <el-card>
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.content }}</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="进度条 Progress" shadow="hover" class="demo-card">
              <el-progress :percentage="50" />
              <el-progress :percentage="80" status="success" />
              <el-progress :percentage="30" status="warning" />
              <el-progress :percentage="70" status="exception" />
              <el-progress type="circle" :percentage="75" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="描述列表 Descriptions" shadow="hover" class="demo-card">
              <el-descriptions title="用户信息" :column="2" border>
                <el-descriptions-item label="用户名">张三</el-descriptions-item>
                <el-descriptions-item label="手机号">13800138000</el-descriptions-item>
                <el-descriptions-item label="居住地">北京市朝阳区</el-descriptions-item>
                <el-descriptions-item label="备注">
                  <el-tag size="small">学校</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="联系地址">北京市朝阳区望京街道</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="统计数值 Statistic" shadow="hover" class="demo-card">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-statistic title="活跃用户" :value="268500" />
                </el-col>
                <el-col :span="12">
                  <el-statistic title="增长率" :value="12.18">
                    <template #suffix>%</template>
                  </el-statistic>
                </el-col>
              </el-row>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="分页 Pagination" shadow="hover" class="demo-card">
              <el-pagination layout="prev, pager, next" :total="100" />
              <el-divider />
              <el-pagination layout="sizes, prev, pager, next, jumper" :total="100" :page-sizes="[10, 20, 30, 50]" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="导航组件" name="nav">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card header="菜单 Menu" shadow="hover" class="demo-card">
              <el-menu mode="horizontal" :default-active="'1'">
                <el-menu-item index="1">处理中心</el-menu-item>
                <el-sub-menu index="2">
                  <template #title>我的工作台</template>
                  <el-menu-item index="2-1">选项1</el-menu-item>
                  <el-menu-item index="2-2">选项2</el-menu-item>
                </el-sub-menu>
                <el-menu-item index="3">消息中心</el-menu-item>
                <el-menu-item index="4">订单管理</el-menu-item>
              </el-menu>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="步骤条 Steps" shadow="hover" class="demo-card">
              <el-steps :active="activeSteps" finish-status="success" align-center>
                <el-step title="步骤 1" description="这是一段描述" />
                <el-step title="步骤 2" description="这是一段描述" />
                <el-step title="步骤 3" description="这是一段描述" />
              </el-steps>
              <el-divider />
              <el-button @click="activeSteps = (activeSteps + 1) % 4">下一步</el-button>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="面包屑 Breadcrumb" shadow="hover" class="demo-card">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                <el-breadcrumb-item>活动管理</el-breadcrumb-item>
                <el-breadcrumb-item>活动列表</el-breadcrumb-item>
                <el-breadcrumb-item>活动详情</el-breadcrumb-item>
              </el-breadcrumb>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="下拉菜单 Dropdown" shadow="hover" class="demo-card">
              <el-dropdown>
                <el-button type="primary">
                  下拉菜单<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item>黄金糕</el-dropdown-item>
                    <el-dropdown-item>狮子头</el-dropdown-item>
                    <el-dropdown-item>螺蛳粉</el-dropdown-item>
                    <el-dropdown-item divided>蚵仔煎</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="页头 PageHeader" shadow="hover" class="demo-card">
              <el-page-header title="返回" content="详情页面" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="反馈组件" name="feedback">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card header="消息提示" shadow="hover" class="demo-card">
              <el-space wrap>
                <el-button @click="ElMessage.success('成功消息')">成功消息</el-button>
                <el-button @click="ElMessage.warning('警告消息')">警告消息</el-button>
                <el-button @click="ElMessage.error('错误消息')">错误消息</el-button>
                <el-button @click="ElMessage.info('信息消息')">信息消息</el-button>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="弹框 Dialog & 抽屉 Drawer" shadow="hover" class="demo-card">
              <el-space>
                <el-button type="primary" @click="showDialog">打开弹框</el-button>
                <el-button type="primary" @click="showDrawer">打开抽屉</el-button>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="加载 Loading" shadow="hover" class="demo-card">
              <el-button type="primary" @click="showLoading" :loading="loading">点击加载</el-button>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="提示 Tooltip & Popover" shadow="hover" class="demo-card">
              <el-space :size="30">
                <el-tooltip content="这是提示内容" placement="top">
                  <el-button>上边提示</el-button>
                </el-tooltip>
                <el-popover title="标题" content="这是弹出框内容" trigger="click">
                  <template #reference>
                    <el-button>点击弹出</el-button>
                  </template>
                </el-popover>
                <el-popconfirm title="确定删除吗？">
                  <template #reference>
                    <el-button type="danger">删除确认</el-button>
                  </template>
                </el-popconfirm>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="警告 Alert" shadow="hover" class="demo-card">
              <el-space direction="vertical" fill style="width: 100%">
                <el-alert title="成功提示" type="success" show-icon />
                <el-alert title="信息提示" type="info" show-icon />
                <el-alert title="警告提示" type="warning" show-icon />
                <el-alert title="错误提示" type="error" show-icon />
                <el-alert title="可关闭的提示" type="success" closable show-icon />
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="消息弹框 MessageBox" shadow="hover" class="demo-card">
              <el-space wrap>
                <el-button @click="ElMessageBox.alert('这是一条消息', '标题')">Alert</el-button>
                <el-button @click="ElMessageBox.confirm('确定执行此操作吗？', '提示')">Confirm</el-button>
                <el-button @click="ElMessageBox.prompt('请输入内容', '提示')">Prompt</el-button>
              </el-space>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="布局组件" name="layout">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card header="栅格系统 Grid" shadow="hover" class="demo-card">
              <el-row :gutter="10">
                <el-col :span="6"><div class="grid-content bg-purple-dark"></div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple"></div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple-light"></div></el-col>
                <el-col :span="6"><div class="grid-content bg-purple"></div></el-col>
              </el-row>
              <el-row :gutter="10">
                <el-col :span="4"><div class="grid-content bg-purple"></div></el-col>
                <el-col :span="4"><div class="grid-content bg-purple-light"></div></el-col>
                <el-col :span="4"><div class="grid-content bg-purple"></div></el-col>
                <el-col :span="4"><div class="grid-content bg-purple-light"></div></el-col>
                <el-col :span="4"><div class="grid-content bg-purple"></div></el-col>
                <el-col :span="4"><div class="grid-content bg-purple-light"></div></el-col>
              </el-row>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="布局容器 Container" shadow="hover" class="demo-card">
              <el-container style="height: 200px">
                <el-header style="background: #b3c0d1">Header</el-header>
                <el-container>
                  <el-aside width="200px" style="background: #d3dce6">Aside</el-aside>
                  <el-main style="background: #e9eef3">Main</el-main>
                </el-container>
                <el-footer style="background: #b3c0d1">Footer</el-footer>
              </el-container>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="间距 Space" shadow="hover" class="demo-card">
              <el-space direction="vertical">
                <el-card shadow="hover" style="width: 200px">卡片 1</el-card>
                <el-card shadow="hover" style="width: 200px">卡片 2</el-card>
                <el-card shadow="hover" style="width: 200px">卡片 3</el-card>
              </el-space>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card header="折叠面板 Collapse" shadow="hover" class="demo-card">
              <el-collapse v-model="activeCollapse">
                <el-collapse-item title="一致性 Consistency" name="1">
                  <div>与现实生活一致：与现实生活的流程、逻辑保持一致，遵循用户习惯的语言和概念；</div>
                </el-collapse-item>
                <el-collapse-item title="反馈 Feedback" name="2">
                  <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
                </el-collapse-item>
                <el-collapse-item title="效率 Efficiency" name="3">
                  <div>简化流程：设计简洁直观的操作流程；</div>
                </el-collapse-item>
              </el-collapse>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="其他组件" name="others">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card header="空状态 Empty" shadow="hover" class="demo-card">
              <el-empty description="暂无数据" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="结果页 Result" shadow="hover" class="demo-card">
              <el-result icon="success" title="成功提示" sub-title="请根据提示进行操作">
                <template #extra>
                  <el-button type="primary">返回首页</el-button>
                </template>
              </el-result>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="骨架屏 Skeleton" shadow="hover" class="demo-card">
              <el-skeleton :rows="5" animated />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="日历 Calendar" shadow="hover" class="demo-card">
              <el-calendar v-model="dateValue" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="回到顶部 Backtop" shadow="hover" class="demo-card">
              <p>向下滚动页面，右下角会出现回到顶部按钮</p>
              <el-backtop :right="100" :bottom="100" />
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card header="分割线 Divider" shadow="hover" class="demo-card">
              <div>上方内容</div>
              <el-divider />
              <div>下方内容</div>
              <el-divider content-position="left">左侧分割线</el-divider>
              <div>更多内容</div>
              <el-divider content-position="right">右侧分割线</el-divider>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

     
    </el-tabs>

    <el-dialog v-model="dialogVisible" title="对话框标题" width="500px">
      <span>这是一段对话框内容</span>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="抽屉标题" size="400px">
      <p>这是抽屉内容</p>
    </el-drawer>
  </ViewContainer>
</template>

<style scoped>
.demo-tabs {
  margin-top: 20px;
}

.demo-card {
  margin-bottom: 20px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
  text-align: center;
  line-height: 36px;
  color: #fff;
}

.bg-purple-dark {
  background: #99a9bf;
}

.bg-purple {
  background: #d3dce6;
}

.bg-purple-light {
  background: #e5e9f2;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}
</style>
