# Sprint 08: 仪表板与集成

**计划类型**: 前端开发计划
**目标**: 完善仪表板对接、路由整合、整体优化
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M4

---

## 1. 目标

完善仪表板对接、路由整合、整体优化。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| DashboardView 对接真实 API | 8h | P0 | ⏳ |
| 路由整合与权限控制 | 6h | P0 | ⏳ |
| 布局组件完善 | 4h | P0 | ⏳ |
| 全局错误处理 | 4h | P1 | ⏳ |
| 加载状态优化 | 4h | P1 | ⏳ |

**总预估工时**: 26h

---

## 3. 交付物

- DashboardView.vue - 对接真实 API 的仪表板页面
- 路由权限控制
- 全局错误处理
- 加载状态优化

---

## 4. 验收标准

- [ ] 仪表板数据真实展示
- [ ] 路由导航正常
- [ ] 权限控制生效

---

## 5. DashboardView 完善

### 5.1 仪表板结构

```
仪表板
├── 项目概览区
│   ├── 项目总数
│   ├── 进行中项目
│   └── 完成项目
├── 需求统计区
│   ├── 需求总数
│   ├── 待处理需求
│   └── 已完成需求
├── 任务统计区
│   ├── 任务总数
│   ├── 待办任务
│   ├── 进行中任务
│   └── 已完成任务
└── 最近活动区
    └── ActivityList
```

### 5.2 API 对接

```typescript
// 仪表板统计数据 API
GET    /dashboard/projects                // 项目统计
GET    /dashboard/requirements            // 需求统计
GET    /dashboard/tasks                  // 任务统计
GET    /dashboard/recent-activities       // 最近活动
```

---

## 6. 路由整合

### 6.1 路由守卫

```typescript
// router/guards.ts
import { useUserStore } from '@/stores/user'

const guards = {
  auth: (to, from, next) => {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      next('/login')
    } else {
      next()
    }
  },
  permission: (to, from, next) => {
    const userStore = useUserStore()
    if (userStore.hasPermission(to.meta.permission)) {
      next()
    } else {
      next('/403')
    }
  }
}
```

### 6.2 路由配置更新

```typescript
{
  path: '/dashboard',
  name: 'DashboardView',
  component: DashboardView,
  meta: {
    requiresAuth: true,
    permission: 'dashboard:view'
  }
},
{
  path: '/projects',
  name: 'ProjectListView',
  component: ProjectListView,
  meta: {
    requiresAuth: true,
    permission: 'project:view'
  }
}
```

---

## 7. 全局错误处理

### 7.1 Axios 拦截器

```typescript
// api/axios.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误，请稍后重试')
          break
        default:
          ElMessage.error('请求失败')
      }
    }
    return Promise.reject(error)
  }
)
```

---

## 8. 加载状态优化

### 8.1 全局 Loading

```typescript
// composables/useLoading.ts
export const useLoading = () => {
  const loading = ref(false)

  const withLoading = async <T>(fn: () => Promise<T>) => {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, withLoading }
}
```

### 8.2 Skeleton 骨架屏

在列表页面使用 Skeleton 组件提升加载体验。

---

## 9. 依赖关系

- **前置条件**: Sprint 7 AI 冲突检测与分解完成
- **后续 Sprint**: Sprint 9 需要项目进度功能

---

## 10. 完成标准

- [ ] 仪表板数据真实展示
- [ ] 路由权限控制生效
- [ ] 错误处理完善
- [ ] 加载状态优化完成

---

**上一 Sprint**: [Sprint 07: AI 冲突检测与分解](sprint-07-frontend-ai-conflict.md)
**下一 Sprint**: [Sprint 09: 高级功能与优化 - 上](sprint-09-frontend-advanced-part1.md)
