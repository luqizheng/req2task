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

### 语义色（亮色模式）

| 用途 | 颜色 | 使用场景 |
|------|------|----------|
| 文字主色 | #1e293b | 标题、重要文字 |
| 文字次要 | #64748b | 描述文字 |
| 文字占位 | #94a3b8 | 辅助信息 |
| 边框 | #e2e8f0 | 分割线、卡片边框 |
| 背景 | #f1f5f9 | 页面背景 |
| 背景次要 | #f8fafc | 卡片背景、hover |

### 语义色（暗色模式）

| 用途 | 颜色 | 使用场景 |
|------|------|----------|
| 文字主色 | #f1f5f9 | 标题、重要文字 |
| 文字次要 | #94a3b8 | 描述文字 |
| 文字占位 | #64748b | 辅助信息 |
| 边框 | #334155 | 分割线、卡片边框 |
| 背景 | #0f172a | 页面背景 |
| 背景次要 | #1e293b | 卡片背景、hover |

### 暗色模式实现

```css
html.dark {
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-border: #334155;
  --color-bg: #0f172a;
  --color-bg-secondary: #1e293b;
  
  --el-color-primary: #3b82f6;
  --el-color-success: #34d399;
  --el-color-warning: #fbbf24;
  --el-color-danger: #f87171;
  --el-color-info: #818cf8;
}
```

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

## 4. 设计原则

1. **信息优先** — 界面服务于信息展示，避免装饰性干扰
2. **层次分明** — 通过留白、字号、颜色区分信息优先级
3. **精准克制** — 动画和视觉效果服务于功能，不过度设计
4. **一致性** — 所有模块遵循统一的设计语言和交互模式
5. **可信赖感** — 重要操作有确认，数据变更有追溯

---

## 5. 动效哲学

### 原则

微动效增强反馈，不喧宾夺主。

### 动画规范

| 属性 | 值 | 用途 |
|------|------|------|
| 持续时间 | 150-300ms | 按钮悬停、状态切换 |
| 缓动函数 | ease-out | 优先使用 |
| 禁用场景 | 大面积位移动画、过度闪烁 | 避免干扰 |

### 适用场景

- 按钮悬停效果
- 模态框展开/收起
- 列表加载动画
- 折叠面板切换
- 页面切换过渡（淡入淡出）

---

## 6. 布局规范

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

基础单位：`4px`

| 名称 | 间距 | 用途 |
|------|------|------|
| 页面内边距 | 20px (5单位) | 页面容器内边距 |
| 卡片间距 | 16px (4单位) | 卡片之间间距 |
| 组件间距 | 12px (3单位) | 组件之间间距 |
| 紧凑间距 | 8px (2单位) | 紧凑场景间距 |
| 元素间距 | 4px (1单位) | 标签、图标等小元素间距 |

### 圆角规范

| 元素 | 圆角 | 说明 |
|------|------|------|
| 卡片 | 12px | 页面主要容器 |
| 按钮 | 8px | 所有按钮类型 |
| 输入框 | 8px | 表单输入控件 |
| 标签/徽章 | 4px | AppTag、AppBadge |
| 头像 | 50% | 圆形头像 |

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
- 卡片统一使用 `el-card`，`shadow="hover"`，圆角 12px

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

## 8. 页面规范

### 页面结构

```vue
<template>
  <ViewContainer>
    <ViewHeader title="页面标题" subtitle="可选副标题">
      <template #actions>
        <ViewToolbar>
          <el-button type="primary">主要操作</el-button>
          <el-button>次要操作</el-button>
        </ViewToolbar>
      </template>
    </ViewHeader>

    <!-- 内容区 -->
    <el-card>...</el-card>
  </ViewContainer>
</template>
```

### 布局组件

| 组件 | 用途 |
|------|------|
| `ViewContainer` | 页面容器，统一内边距 |
| `ViewHeader` | 页面头部，含标题、返回按钮、操作区 |
| `ViewToolbar` | 工具栏，统一按钮间距 |

**强制要求**：所有 View 必须使用 `ViewContainer` 包裹。

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

## 11. 目录结构

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
