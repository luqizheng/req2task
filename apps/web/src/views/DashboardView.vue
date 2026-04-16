<script setup lang="ts">
import { ref } from 'vue'
import { Folder, Document, Check, Warning, MagicStick, ArrowRight, Top, Bottom, Timer, Reading, CircleCheck } from '@element-plus/icons-vue'

interface StatCard {
  title: string
  value: number | string
  trend?: string
  trendUp?: boolean
  color: string
  icon: any
}

interface CostStat {
  title: string
  current: number
  total: number
  unit: string
  icon: any
  color: string
}

interface Milestone {
  name: string
  progress: number
  status: 'completed' | 'in-progress' | 'pending'
  deadline: string
}

interface RecentActivity {
  id: number
  user: string
  action: string
  target: string
  time: string
  type: 'create' | 'update' | 'ai'
}

const statCards = ref<StatCard[]>([
  { title: '需求总数', value: 128, trend: '+12%', trendUp: true, color: '#2563eb', icon: Folder },
  { title: '用户故事', value: 356, trend: '+8%', trendUp: true, color: '#10b981', icon: Document },
  { title: '待验收', value: 24, trend: '-5%', trendUp: false, color: '#f59e0b', icon: Check },
  { title: '风险项', value: 3, trend: '+1', trendUp: false, color: '#ef4444', icon: Warning },
])

const costStats = ref<CostStat[]>([
  { title: '执行进度', current: 45, total: 60, unit: '天', icon: Timer, color: '#2563eb' },
  { title: '故事点', current: 186, total: 240, unit: '点', icon: Reading, color: '#10b981' },
  { title: '任务完成', current: 78, total: 100, unit: '个', icon: CircleCheck, color: '#6366f1' },
])

const milestones = ref<Milestone[]>([
  { name: 'v2.0 基础框架', progress: 100, status: 'completed', deadline: '2024-03-01' },
  { name: 'v2.1 用户模块', progress: 75, status: 'in-progress', deadline: '2024-04-15' },
  { name: 'v2.2 权限系统', progress: 30, status: 'in-progress', deadline: '2024-05-30' },
  { name: 'v2.3 API集成', progress: 0, status: 'pending', deadline: '2024-06-30' },
])

const recentActivities = ref<RecentActivity[]>([
  { id: 1, user: '李分析师', action: '创建需求', target: '用户登录功能', time: '10分钟前', type: 'create' },
  { id: 2, user: '王开发', action: '更新状态', target: 'API文档编写', time: '30分钟前', type: 'update' },
  { id: 3, user: 'AI助手', action: '生成用户故事', target: '权限管理模块', time: '1小时前', type: 'ai' },
  { id: 4, user: '张经理', action: '审批需求', target: '数据导出功能', time: '2小时前', type: 'update' },
  { id: 5, user: 'AI助手', action: '拆分任务', target: '订单模块', time: '3小时前', type: 'ai' },
])

const aiSuggestions = ref([
  { title: '建议拆分', desc: '"订单管理"模块建议拆分为3个子需求', type: '拆分' },
  { title: '风险提示', desc: '"支付集成"需求依赖第三方API，建议提前沟通', type: '风险' },
  { title: '优化建议', desc: '"用户反馈"需求与现有"意见收集"功能重叠', type: '优化' },
])

const getMilestoneStatusType = (status: string) => {
  const map: Record<string, string> = { completed: 'success', 'in-progress': 'primary', pending: 'info' }
  return map[status] || 'info'
}

const getMilestoneStatusText = (status: string) => {
  const map: Record<string, string> = { completed: '已完成', 'in-progress': '进行中', pending: '待开始' }
  return map[status] || ''
}

const getActivityTypeColor = (type: string) => {
  return type === 'ai' ? '#6366f1' : '#2563eb'
}

const getCostPercentage = (current: number, total: number) => {
  return Math.round((current / total) * 100)
}
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">项目概览</h2>
      <div class="header-actions">
        <el-button type="primary">
          <el-icon class="mr-1"><MagicStick /></el-icon>
          AI 智能分析
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="12" :md="6" v-for="stat in statCards" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-title">{{ stat.title }}</p>
              <div class="stat-value-row">
                <span class="stat-value">{{ stat.value }}</span>
                <span v-if="stat.trend" class="stat-trend" :class="{ up: stat.trendUp, down: !stat.trendUp }">
                  <el-icon><Top v-if="stat.trendUp" /><Bottom v-else /></el-icon>
                  {{ stat.trend }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="cost-row">
      <el-col :xs="24" :sm="8" v-for="cost in costStats" :key="cost.title">
        <el-card class="cost-card" shadow="hover">
          <div class="cost-header">
            <div class="cost-icon" :style="{ backgroundColor: cost.color + '15', color: cost.color }">
              <el-icon :size="20"><component :is="cost.icon" /></el-icon>
            </div>
            <span class="cost-title">{{ cost.title }}</span>
          </div>
          <div class="cost-progress">
            <el-progress 
              :percentage="getCostPercentage(cost.current, cost.total)" 
              :stroke-width="10"
              :color="cost.color"
            />
          </div>
          <div class="cost-info">
            <span class="cost-current">{{ cost.current }}</span>
            <span class="cost-divider">/</span>
            <span class="cost-total">{{ cost.total }} {{ cost.unit }}</span>
            <span class="cost-percent">({{ getCostPercentage(cost.current, cost.total) }}%)</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :lg="14">
        <el-card class="milestone-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">里程碑进度</span>
              <el-link type="primary">查看全部 <el-icon><ArrowRight /></el-icon></el-link>
            </div>
          </template>
          <div class="milestone-list">
            <div v-for="m in milestones" :key="m.name" class="milestone-item">
              <div class="milestone-header">
                <span class="milestone-name">{{ m.name }}</span>
                <el-tag :type="getMilestoneStatusType(m.status)" size="small">
                  {{ getMilestoneStatusText(m.status) }}
                </el-tag>
              </div>
              <div class="milestone-progress">
                <el-progress :percentage="m.progress" :stroke-width="8" :show-text="false" />
                <span class="progress-text">{{ m.progress }}%</span>
              </div>
              <p class="milestone-deadline">截止日期：{{ m.deadline }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card class="ai-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon class="ai-icon"><MagicStick /></el-icon>
                AI 智能建议
              </span>
            </div>
          </template>
          <div class="ai-list">
            <div v-for="suggestion in aiSuggestions" :key="suggestion.title" class="ai-item">
              <div class="ai-item-header">
                <el-tag size="small" type="warning">{{ suggestion.type }}</el-tag>
                <span class="ai-title">{{ suggestion.title }}</span>
              </div>
              <p class="ai-desc">{{ suggestion.desc }}</p>
            </div>
          </div>
          <div class="ai-footer">
            <el-button type="primary" plain size="small">查看更多建议</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :span="24">
        <el-card class="activity-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近活动</span>
              <el-link type="primary">查看全部 <el-icon><ArrowRight /></el-icon></el-link>
            </div>
          </template>
          <el-table :data="recentActivities" :show-header="false" class="activity-table">
            <el-table-column prop="user" width="100">
              <template #default="{ row }">
                <span class="activity-user">{{ row.user }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="action" width="120">
              <template #default="{ row }">
                <el-tag size="small" :color="getActivityTypeColor(row.type) + '20'" :style="{ color: getActivityTypeColor(row.type), border: 'none' }">
                  {{ row.action }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target">
              <template #default="{ row }">
                <el-link type="primary" :underline="false">{{ row.target }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="time" width="100" align="right">
              <template #default="{ row }">
                <span class="activity-time">{{ row.time }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stat-row {
  margin-bottom: 16px;
}

.cost-row {
  margin-bottom: 16px;
}

.cost-card {
  height: 100%;
}

.cost-card :deep(.el-card__body) {
  padding: 16px;
}

.cost-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.cost-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cost-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.cost-progress {
  margin-bottom: 8px;
}

.cost-progress :deep(.el-progress) {
  margin-right: 0;
}

.cost-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
}

.cost-current {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.cost-divider {
  color: #94a3b8;
}

.cost-total {
  color: #64748b;
}

.cost-percent {
  color: #94a3b8;
  font-size: 12px;
  margin-left: 4px;
}

.stat-card {
  height: 100%;
}

.stat-card :deep(.el-card__body) {
  padding: 16px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-title {
  margin: 0 0 4px;
  font-size: 13px;
  color: #64748b;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
}

.stat-trend.up {
  color: #10b981;
}

.stat-trend.down {
  color: #ef4444;
}

.content-row {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-icon {
  color: #6366f1;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.milestone-item {
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.milestone-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.milestone-name {
  font-weight: 500;
  color: #1e293b;
}

.milestone-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.milestone-progress :deep(.el-progress) {
  flex: 1;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  min-width: 40px;
  text-align: right;
}

.milestone-deadline {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.ai-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.ai-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ai-title {
  font-weight: 500;
  color: #1e293b;
}

.ai-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.ai-footer {
  margin-top: 16px;
  text-align: center;
}

.activity-table :deep(.el-table__row) {
  cursor: pointer;
}

.activity-table :deep(.el-table__row:hover) {
  background-color: #f8fafc;
}

.activity-user {
  font-weight: 500;
  color: #1e293b;
}

.activity-time {
  font-size: 12px;
  color: #94a3b8;
}

.mr-1 {
  margin-right: 4px;
}
</style>
