<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document,
  MagicStick,
  ArrowRight,
  Check,
  User,
  Setting,
  Connection
} from '@element-plus/icons-vue'

const router = useRouter()

const features = ref([
  {
    icon: markRaw(Document),
    title: '需求管理',
    desc: '完整的需求生命周期管理，支持层级嵌套和状态流转',
    color: '#2563eb'
  },
  {
    icon: markRaw(MagicStick),
    title: 'AI 智能辅助',
    desc: 'AI 自动生成需求、拆分任务、检测冲突',
    color: '#6366f1'
  },
  {
    icon: markRaw(Check),
    title: '变更追溯',
    desc: '完整的变更历史记录，支持版本对比',
    color: '#10b981'
  },
  {
    icon: markRaw(User),
    title: '团队协作',
    desc: '多角色权限管理，项目成员协同工作',
    color: '#f59e0b'
  },
  {
    icon: markRaw(Connection),
    title: '知识库构建',
    desc: 'RAG 向量检索，构建项目知识图谱',
    color: '#ec4899'
  },
  {
    icon: markRaw(Setting),
    title: '可视化看板',
    desc: '任务看板、燃尽图、进度统计一览无余',
    color: '#8b5cf6'
  }
])

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon :size="28" class="logo-icon"><MagicStick /></el-icon>
          <span class="logo-text">req2task</span>
        </div>
        <nav class="nav">
          <el-button text @click="goToLogin">登录</el-button>
          <el-button type="primary" @click="goToRegister">立即开始</el-button>
        </nav>
      </div>
    </header>

    <main class="main">
      <section class="hero">
        <div class="hero-bg">
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="gradient-orb orb-3"></div>
        </div>
        <div class="hero-content">
          <h1 class="hero-title">
            智能需求管理
            <span class="highlight">让团队协作更高效</span>
          </h1>
          <p class="hero-desc">
            req2task 是新一代 AI 驱动的需求管理系统，支持需求全生命周期管理、<br>
            多维度信息关联、智能变更检测和可视化进度追踪
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="goToRegister">
              免费开始
              <el-icon class="ml-2"><ArrowRight /></el-icon>
            </el-button>
            <el-button size="large" @click="goToLogin">了解更多</el-button>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-header">
          <h2 class="section-title">核心功能</h2>
          <p class="section-desc">一站式满足需求管理的全部需求</p>
        </div>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card"
          >
            <div
              class="feature-icon"
              :style="{ backgroundColor: feature.color + '15', color: feature.color }"
            >
              <el-icon :size="24"><component :is="feature.icon" /></el-icon>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-desc">{{ feature.desc }}</p>
          </div>
        </div>
      </section>

      <section class="stats">
        <div class="stat-item">
          <span class="stat-value">99.9%</span>
          <span class="stat-label">系统可用性</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">50+</span>
          <span class="stat-label">企业客户</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">10K+</span>
          <span class="stat-label">每日需求处理</span>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>&copy; 2024 req2task. AI驱动的需求管理系统.</p>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #f1f5f9;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  color: #2563eb;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.nav {
  display: flex;
  gap: 8px;
}

.main {
  flex: 1;
}

.hero {
  position: relative;
  padding: 80px 24px 100px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  top: -200px;
  right: -100px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  bottom: -150px;
  left: -100px;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  top: 50%;
  left: 30%;
  opacity: 0.3;
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  margin: 0 0 24px;
}

.highlight {
  display: block;
  background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 18px;
  color: #64748b;
  line-height: 1.7;
  margin: 0 0 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-actions :deep(.el-button) {
  padding: 12px 32px;
  font-size: 16px;
  height: auto;
}

.ml-2 {
  margin-left: 8px;
}

.features {
  padding: 80px 24px;
  background: white;
}

.features-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
}

.section-desc {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 32px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
}

.feature-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.stats {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 24px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
}

.stat-item {
  text-align: center;
  padding: 0 60px;
}

.stat-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #94a3b8;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #334155;
}

.footer {
  padding: 24px;
  text-align: center;
  background: #0f172a;
}

.footer p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }

  .hero-desc {
    font-size: 16px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    flex-direction: column;
    gap: 32px;
  }

  .stat-divider {
    width: 100px;
    height: 1px;
  }

  .stat-item {
    padding: 0;
  }
}
</style>
