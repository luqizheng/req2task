# req2task 设计规则

## 1. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4.0 | 框架 |
| Element Plus | ^2.13.7 | UI 组件库 |
| Tailwind CSS | ^4.2.2 | 样式工具 |
| Vue Router | ^4.2.0 | 路由 |
| Pinia | ^2.1.0 | 状态管理 |
| TypeScript | ^5.3.0 | 类型 |

---

## 2. 色彩系统

### 主题色

```css
:root {
  --color-primary: #2563eb;        /* 主色 - 蓝色 */
  --color-primary-light: #3b82f6;
  --color-primary-dark: #1d4ed8;
  
  --color-success: #10b981;         /* 成功 */
  --color-warning: #f59e0b;         /* 警告 */
  --color-danger: #ef4444;         /* 危险 */
  --color-info: #6366f1;           /* AI/信息 - 紫色 */
}
```

### 语义色

| 用途 | 颜色 | 使用场景 |
|------|------|----------|
| 文字主色 | #1e293b | 标题、重要文字 |
| 文字次要 | #64748b | 描述文字 |
| 文字占位 | #94a3b8 | 辅助信息 |
| 边框 | #e2e8f0 | 分割线、卡片边框 |
| 背景 | #f1f5f9 | 页面背景 |
| 背景次要 | #f8fafc | 卡片背景、hover |

### Element Plus 覆盖

在 `src/styles/element/index.scss` 中覆盖主题变量：

```scss
@use "element-plus/theme-chalk/src/index.scss" as *;

:root {
  --el-color-primary: #2563eb;
  --el-color-success: #10b981;
  --el-color-warning: #f59e0b;
  --el-color-danger: #ef4444;
  --el-color-info: #6366f1;
}
```

---

## 3. 字体系统

```css
:root {
  --font-family: 'Inter', 'Source Han Sans CN', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 字号层级

| 层级 | 字号 | 字重 | 行高 |
|------|------|------|------|
| Display | 32px | 700 | 1.2 |
| H1 | 24px | 600 | 1.3 |
| H2 | 20px | 600 | 1.3 |
| H3 | 16px | 600 | 1.4 |
| Body | 14px | 400 | 1.5 |
| Caption | 12px | 400 | 1.5 |

---

## 4. 布局规范

### 页面结构

```
┌─────────────────────────────────────────┐
│  侧边栏 (240px/64px 可折叠)             │
│  ┌─────────────────────────────────────┐
│  │ Logo + 导航菜单                      │
│  │ ...                                  │
│  │ 展开/收起按钮                        │
│  └─────────────────────────────────────┤
├──────────┬──────────────────────────────┤
│ 顶栏    │                              │
│ 60px    │       主内容区                │
├──────────┤                              │
│          │                              │
│ 搜索    │                              │
│ 通知    │                              │
│ 用户    │                              │
└──────────┴──────────────────────────────┘
```

### 间距系统

- 页面内边距：`20px`
- 卡片间距：`16px`
- 组件间距：`12px`
- 紧凑间距：`8px`

### 响应式断点

| 断点 | 宽度 | 列数 |
|------|------|------|
| xs | < 576px | 1 |
| sm | ≥ 576px | 2 |
| md | ≥ 768px | 3-4 |
| lg | ≥ 992px | 4-6 |
| xl | ≥ 1200px | 6+ |

---

## 5. 组件规范

### 通用

- 使用 Element Plus 组件作为基础
- 自定义样式通过 `scoped` CSS 或 Tailwind 工具类
- 卡片统一使用 `el-card`，`shadow="hover"`

### 按钮

| 类型 | 样式 | 用途 |
|------|------|------|
| primary | 实心蓝色 | 主要操作 |
| default | 线框灰色 | 次要操作 |
| danger | 红色 | 危险操作 |
| link | 文字链接 | 辅助操作 |

### 表格

- 使用 `el-table` 组件
- 配置 `stripe` 斑马纹
- 操作列固定在右侧 `fixed="right"`

### 表单

- 使用 `el-form` + `el-form-item`
- 必填项添加 `*` 标记
- 错误提示显示在字段下方

### 图标

- 使用 `@element-plus/icons-vue`
- 图标尺寸：`16px` / `20px` / `24px`
- 按钮图标：左侧放置

---

## 6. 页面规范

### 页面结构

```vue
<template>
  <div class="page-name">
    <div class="page-header">
      <h2 class="page-title">页面标题</h2>
      <div class="header-actions">
        <!-- 操作按钮 -->
      </div>
    </div>
    
    <!-- 内容区 -->
    <el-card>...</el-card>
  </div>
</template>
```

### 路由配置

```typescript
const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/users', name: 'users', component: () => import('@/views/UserManageView.vue') },
]
```

### 布局使用

- 登录页 `/login` 不使用布局
- 其他页面使用 `MainLayout` 包裹

---

## 7. AI 特性规范

### 视觉标识

- AI 相关功能使用紫色 `#6366f1`
- 渐变背景：`linear-gradient(135deg, #6366f1, #8b5cf6)`
- AI 助手图标使用 `MagicStick`

### 功能标记

- AI 生成的内容添加紫色标签
- AI 建议使用独立卡片展示

---

## 8. 命名规范

### 文件命名

- 页面：`XxxView.vue`
- 组件：`XxxComponent.vue` 或 `Xxx.vue`
- 布局：`MainLayout.vue`

### CSS 类名

- 页面：`page-{name}`
- 组件：使用 BEM 风格 `.component-name__element--modifier`

---

## 9. 目录结构

```
src/
├── components/
│   └── layout/
│       └── MainLayout.vue
├── router/
│   └── index.ts
├── styles/
│   ├── element/
│   │   └── index.scss    # Element Plus 主题覆盖
│   └── main.css          # 全局样式
├── views/
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   └── UserManageView.vue
├── App.vue
└── main.ts
```

---

## 10. 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用 `<script setup lang="ts">`
- 样式使用 `scoped`

### 提交前检查

```bash
pnpm run build  # 构建通过
pnpm run lint   # 代码检查
```
