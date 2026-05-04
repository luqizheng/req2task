# 颜色变量使用规则

基于 shadcn 语义化颜色系统，所有颜色通过 CSS 变量定义在 `index.css`，映射为 Tailwind 语义类使用。

## 禁止

- **禁止硬编码 Tailwind 颜色类**：如 `text-slate-500`、`bg-red-100`、`text-green-600` 等
- **禁止硬编码色值**：如 `color: #333`、`background: #f5f5f5`

## 颜色变量表

| Token | CSS 变量 | Tailwind 类 | 用途 |
|-------|----------|-------------|------|
| Background | `--background` | `bg-background` / `text-background` | 页面背景 |
| Foreground | `--foreground` | `text-foreground` | 主文本颜色 |
| Card | `--card` | `bg-card` | 卡片背景 |
| Card Foreground | `--card-foreground` | `text-card-foreground` | 卡片内主文本 |
| Popover | `--popover` | `bg-popover` | 浮层背景 |
| Popover Foreground | `--popover-foreground` | `text-popover-foreground` | 浮层文本 |
| Primary | `--primary` | `bg-primary` / `text-primary` | 主按钮、强调色 |
| Primary Foreground | `--primary-foreground` | `text-primary-foreground` | 主按钮上的文字 |
| Secondary | `--secondary` | `bg-secondary` | 次要操作背景 |
| Secondary Foreground | `--secondary-foreground` | `text-secondary-foreground` | 次要操作文字 |
| Muted | `--muted` | `bg-muted` | 弱化背景（hover、禁用） |
| Muted Foreground | `--muted-foreground` | `text-muted-foreground` | 次要/辅助文本 |
| Accent | `--accent` | `bg-accent` | 高亮、选中态背景 |
| Accent Foreground | `--accent-foreground` | `text-accent-foreground` | 高亮态文字 |
| Destructive | `--destructive` | `bg-destructive` / `text-destructive` | 危险操作、错误提示、删除 |
| Destructive Foreground | `--destructive-foreground` | `text-destructive-foreground` | 危险按钮上的文字 |
| Border | `--border` | `border-border` | 边框、分割线 |
| Input | `--input` | `border-input` | 输入框边框 |
| Ring | `--ring` | `ring-ring` | 焦点环（focus ring） |
| Chart 1-5 | `--chart-1~5` | `text-chart-1~5` | 图表系列色 |
| Sidebar * | `--sidebar-*` | `bg-sidebar` / `text-sidebar-*` | 侧边栏专用 |

## 使用方式

### 方式一：Tailwind 语义类（推荐）

```vue
<template>
  <!-- 页面背景 -->
  <div class="bg-background text-foreground">
    <!-- 卡片 -->
    <div class="bg-card border-border">
      <h2 class="text-card-foreground">标题</h2>
      <p class="text-muted-foreground">次要描述</p>
    </div>

    <!-- 主按钮 -->
    <Button class="bg-primary text-primary-foreground">提交</Button>

    <!-- 危险操作 -->
    <Button variant="destructive">删除</Button>

    <!-- 输入框 -->
    <Input class="border-input focus:ring-ring" />

    <!-- 错误提示 -->
    <p class="text-destructive">{{ error }}</p>
  </div>
</template>
```

### 方式二：CSS var() 函数

```vue
<style scoped>
.custom-class {
  background-color: var(--background);
  color: var(--muted-foreground);
  border-color: var(--border);
}
</style>
```

## 透明度修饰

通过 Tailwind 的透明度后缀调节：

```vue
<div class="bg-primary/10 text-primary/80 border-border/60 hover:bg-destructive/10" />
```

## 暗色模式

通过 `.dark` 类切换，所有语义色自动适配。无需额外编写暗色样式。
