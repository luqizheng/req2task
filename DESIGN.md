# DESIGN.md

## 设计系统

本项目使用 CSS 变量驱动的设计系统，所有颜色基于 `apps/web/src/assets/index.css` 中定义的主题变量。更换 shadcn 主题时自动适配。

---

## 色彩系统

### 主题色板

| Token | 变量 | 用途 |
|-------|------|------|
| Primary | `var(--primary)` | 主操作、强调元素 |
| Secondary | `var(--secondary)` | 次要元素、背景 |
| Accent | `var(--accent)` | 高亮、选中状态 |
| Destructive | `var(--destructive)` | 危险操作、错误 |
| Background | `var(--background)` | 页面背景 |
| Foreground | `var(--foreground)` | 主文本 |
| Muted | `var(--muted)` | 次要背景 |
| Muted Foreground | `var(--muted-foreground)` | 次要文本 |
| Border | `var(--border)` | 边框、分割线 |
| Input | `var(--input)` | 输入框边框 |
| Ring | `var(--ring)` | 焦点环 |

### 语义色

| 用途 | CSS 变量 | 说明 |
|------|----------|------|
| 成功 | `var(--chart-4)` | 完成状态 |
| 警告 | `var(--chart-2)` | 警告状态 |
| 信息 | `var(--chart-3)` | 信息提示 |
| 图表色1 | `var(--chart-1)` | 图表系列1（主色） |
| 图表色2 | `var(--chart-2)` | 图表系列2 |
| 图表色3 | `var(--chart-3)` | 图表系列3 |
| 图表色4 | `var(--chart-4)` | 图表系列4 |
| 图表色5 | `var(--chart-5)` | 图表系列5 |

### 状态色

| 状态 | 背景 | 文字 |
|------|------|------|
| 规划中 | `var(--secondary)` | `var(--secondary-foreground)` |
| 进行中 | `var(--accent)` | `var(--accent-foreground)` |
| 暂停 | `var(--accent)` | `var(--accent-foreground)` |
| 已完成 | `var(--muted)` | `var(--muted-foreground)` |
| 已归档 | `var(--muted)` | `var(--muted-foreground)` |

---

## 排版系统

### 字体栈

| 用途 | CSS 变量 | 备选 |
|------|----------|------|
| Sans | `var(--font-sans)` | Plus Jakarta Sans, Quicksand, system-ui |
| Serif | `var(--font-serif)` | Chillax, Playfair Display |
| Mono | `var(--font-mono)` | Fira Code, monospace |

### 字重

| 名称 | 数值 | 用途 |
|------|------|------|
| Regular | 400 | 正文 |
| Medium | 500 | 标签 |
| Semibold | 600 | 小标题 |
| Bold | 700 | 大标题 |

### 字号层级

```css
--text-xs: 0.75rem;    /* 12px - 标签、计数 */
--text-sm: 0.875rem;   /* 14px - 次要文本 */
--text-base: 1rem;      /* 16px - 正文 */
--text-lg: 1.125rem;    /* 18px - 副标题 */
--text-xl: 1.25rem;     /* 20px - 卡片标题 */
--text-2xl: 1.5rem;     /* 24px - 页面标题 */
--text-3xl: 1.875rem;   /* 30px - 大标题 */
```

---

## 间距系统

基于 4px 网格：

| Token | 值 | 用途 |
|-------|-----|------|
| `--spacing-1` | 4px | 紧凑间距 |
| `--spacing-2` | 8px | 小间距 |
| `--spacing-3` | 12px | 默认间距 |
| `--spacing-4` | 16px | 中间距 |
| `--spacing-5` | 20px | 卡片内间距 |
| `--spacing-6` | 24px | 大间距 |
| `--spacing-8` | 32px | 区块间距 |

---

## 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | ~12px | 按钮、输入框 |
| `--radius-md` | ~14px | 小卡片 |
| `--radius-lg` | 16px | 卡片 |
| `--radius-xl` | 20px | 大卡片、模态框 |

---

## 阴影系统

| Token | 用途 |
|-------|------|
| `--shadow-xs` | 极轻阴影 |
| `--shadow-sm` | 按钮、输入框悬停 |
| `--shadow` | 默认卡片 |
| `--shadow-md` | 浮层 |
| `--shadow-lg` | 模态框 |
| `--shadow-xl` | 大模态框 |
| `--shadow-2xl` | 极大阴影 |

---

## 组件规范

### 按钮

```html
<Button class="bg-primary text-primary-foreground hover:opacity-90">
  主要操作
</Button>
<Button variant="outline" class="border-border hover:bg-muted">
  次要操作
</Button>
<Button variant="ghost" class="hover:bg-muted">
  文字按钮
</Button>
```

### 卡片

```html
<Card class="border-border bg-card shadow-sm">
  <CardHeader>
    <CardTitle class="text-foreground">标题</CardTitle>
  </CardHeader>
  <CardContent>
    <p class="text-muted-foreground">内容</p>
  </CardContent>
</Card>
```

### 状态徽章

```html
<Badge class="bg-secondary text-secondary-foreground">
  状态
</Badge>
```

### 输入框

```html
<Input class="border-input bg-background focus:ring-ring" />
```

---

## 图标规范

使用 Lucide Vue Next，保持 16px/20px/24px 尺寸，与文字基线对齐。

---

## 暗色模式

所有组件自动适配，通过 `.dark` 类切换。设计时使用 CSS 变量确保一致性。
