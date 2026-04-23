# Sprint 13: 体验优化

**计划类型**: 前端开发
**目标**: 提升用户体验，完善加载态、空状态、响应式
**预计时长**: 1 周 (约 4 人天)
**状态**: ⏳ 待开始
**里程碑**: M6

---

## 1. 目标

- 统一骨架屏加载态
- 统一空状态组件
- 响应式适配
- 路由过渡动画
- 页面性能优化

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| 全局骨架屏配置 | feature | 4h | P2 | ⏳ |
| 列表页面骨架屏 | feature | 4h | P2 | ⏳ |
| 表单页面骨架屏 | feature | 2h | P2 | ⏳ |
| 详情页面骨架屏 | feature | 2h | P2 | ⏳ |
| 全局空状态组件 | feature | 3h | P2 | ⏳ |
| 错误边界处理 | feature | 4h | P2 | ⏳ |
| 路由过渡动画 | feature | 4h | P2 | ⏳ |
| 移动端布局适配 | feature | 8h | P2 | ⏳ |
| 图片懒加载 | feature | 2h | P3 | ⏳ |
| 重复代码抽取 | refactor | 4h | P2 | ⏳ |

**总预估工时**: 37h

---

## 3. 详细设计

### 3.1 骨架屏

**实现方案**: 使用 `el-skeleton` 组件

```vue
<!-- components/common/AppSkeleton.vue -->
<script setup lang="ts">
defineProps<{
  type?: 'list' | 'form' | 'detail' | 'card'
  rows?: number
}>()
</script>

<template>
  <div class="app-skeleton">
    <el-skeleton :rows="rows || 5" animated />
  </div>
</template>
```

**使用场景**:
- 列表页: `type="list"`, `rows=8`
- 表单页: `type="form"`, `rows=6`
- 详情页: `type="detail"`, `rows=5`

### 3.2 路由过渡

```typescript
// src/router/index.ts
const routes = [
  // ... existing routes
]

// 添加过渡动画配置
export const routeTransition = {
  name: 'fade-slide',
  duration: 200
}
```

```vue
<!-- App.vue -->
<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade-slide'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
```

### 3.3 响应式布局

**断点定义**:
| 断点 | 宽度 | 布局 |
|------|------|------|
| xs | < 576px | 单列堆叠 |
| sm | ≥ 576px | 双列 |
| md | ≥ 768px | 三列 |
| lg | ≥ 992px | 四列 |
| xl | ≥ 1200px | 侧边栏展开 |

**侧边栏适配**:
- 移动端: 抽屉式侧边栏
- 桌面端: 固定侧边栏 (240px 展开, 64px 折叠)

```vue
<!-- MainLayout.vue -->
<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside 
      :width="isCollapsed ? '64px' : '240px'"
      class="sidebar"
      :class="{ 'sidebar--drawer': isMobile }"
    >
      <!-- 导航菜单 -->
    </el-aside>
    
    <!-- 主内容 -->
    <el-main class="main-content">
      <slot />
    </el-main>
  </el-container>
</template>
```

### 3.4 错误边界

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err.message
  return false
})
</script>

<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <el-result
      icon="error"
      title="页面出错了"
      :sub-title="errorMessage"
    >
      <template #extra>
        <el-button type="primary" @click="$router.go(0)">
          刷新页面
        </el-button>
        <el-button @click="$router.push('/dashboard')">
          返回首页
        </el-button>
      </template>
    </el-result>
  </div>
</template>
```

### 3.5 性能优化

- 图片懒加载: `v-lazy` 指令
- 虚拟列表: `el-table-v2` 用于大数据量
- KeepAlive: 缓存页面状态

---

## 4. 验收标准

- [ ] 所有列表页面有骨架屏
- [ ] 所有空状态有统一组件
- [ ] 移动端可基本使用
- [ ] 路由切换有平滑动画
- [ ] 无明显性能问题

---

**上一步**: [Sprint 12: 组件体系](sprint-12-frontend-components.md)
**下一步**: [Sprint 14: 权限与通知](sprint-15-frontend-permission.md)
