# @req2task/web-shadcn

## 开发指南

### 启动开发服务器

```bash
cd apps/web
pnpm dev
```

### 构建

```bash
cd apps/web
pnpm build
```

### 代码检查

```bash
cd apps/web
pnpm lint
```

### 类型检查

```bash
cd apps/web
pnpm type-check
```

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **UI 库**: shadcn-vue + Reka UI
- **样式**: Tailwind CSS v4
- **表单验证**: VeeValidate + Zod
- **工具库**: VueUse, clsx, tailwind-merge
- **图标**: Lucide Vue Next
- **语言**: TypeScript
- **代码检查**: ESLint 9 + TypeScript 支持

## 目录结构

```
apps/web-shadcn/src/
├── components/
│   └── ui/           # shadcn-vue UI 组件
│       ├── button/
│       ├── card/
│       ├── dialog/
│       ├── form/
│       ├── input/
│       ├── select/
│       ├── tabs/
│       └── ...
├── lib/
│   └── utils.ts      # 工具函数（cn 合并类名）
├── App.vue
├── main.ts
└── assets/
    └── index.css     # Tailwind 入口
```

## UI 组件

使用 shadcn-vue 提供的组件，组件位于 `src/components/ui/`：

### 可用组件

| 组件 | 说明 |
|------|------|
| `Button` | 按钮，支持多种变体和尺寸 |
| `Card` | 卡片容器（Card, CardHeader, CardContent 等） |
| `Dialog` | 对话框 |
| `DropdownMenu` | 下拉菜单 |
| `Form` | 表单（FormField, FormItem, FormLabel 等） |
| `Input` | 输入框 |
| `Label` | 标签 |
| `Popover` | 弹出框 |
| `Select` | 选择器 |
| `Tabs` | 标签页 |
| `Textarea` | 文本域 |
| `Tooltip` | 工具提示 |
| `Checkbox` | 复选框 |
| `RadioGroup` | 单选组 |
| `Switch` | 开关 |
| `Separator` | 分隔线 |
| `Badge` | 徽章 |
| `Avatar` | 头像 |
| `Skeleton` | 骨架屏 |
| `ScrollArea` | 滚动区域 |
| `Sonner` |  Toast 通知 |

### 使用方式

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
```

### 类名合并

使用 `cn()` 函数合并类名：

```typescript
import { cn } from '@/lib/utils'

const classes = cn(
  'base-classes',
  isActive && 'active-class',
  className // 允许外部传入类名覆盖
)
```

## shadcn-vue 配置

配置文件位于 `components.json`：

- **style**: `reka-nova`
- **icon library**: `lucide`
- **aliases**: 
  - `components`: `@/components`
  - `ui`: `@/components/ui`
  - `utils`: `@/lib/utils`

## 添加新组件

使用 shadcn-vue CLI 添加组件：

```bash
npx shadcn-vue@latest add [component-name]
```

例如：
```bash
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add form
npx shadcn-vue@latest add select
```

## 开发规范

1. 使用 `<script setup lang="ts">` 语法
2. 样式使用 Tailwind CSS，不写自定义 CSS
3. 组件类名使用 `cn()` 合并
4. 遵循 shadcn-vue 组件模式
5. 支持 TSX 语法（需要使用 `@vitejs/plugin-vue-jsx`）
6. 运行 `pnpm lint` 检查代码后再提交
7. 运行 `pnpm build`（包含类型检查）后再提交
