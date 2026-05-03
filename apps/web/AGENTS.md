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

### 自动修复未使用的导入

项目提供了专门的工具来检测和移除未使用的导入：

```bash
# 从根目录运行（推荐）
pnpm lint:remove-unused --web              # 检测前端未使用的导入
pnpm lint:remove-unused:fix --web          # 自动移除

# 或直接在 web 目录运行
cd apps/web && npx tsx ../../scripts/remove-unused-imports.ts --web --fix
```

### 强制规则

- **禁止 console.log**：使用 `console.warn` 或 `console.error`
- **禁止 debugger**：使用断点调试
- **禁止未使用的导入**：定期运行 `pnpm lint:remove-unused:fix --web`
- **测试文件豁免**：`*.test.ts` 文件豁免 console 和未使用变量检查
- **颜色必须使用 CSS 变量**：所有颜色必须从 `src/assets/index.css` 定义的 CSS 变量获取，禁止硬编码 Tailwind 颜色类（如 `text-slate-500`、`bg-red-100` 等）。必须使用设计系统变量：
  - 背景：`background`、`card`、`muted`、`accent`
  - 文字：`foreground`、`card-foreground`、`muted-foreground`、`primary-foreground`
  - 强调：`primary`、`secondary`、`destructive`
  - 边框：`border`、`input`、`ring`
  - 特殊场景需要自定义颜色时，需同步更新 `index.css` 的 CSS 变量定义

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
| `Field` | 表单字段容器（Field, FieldLabel, FieldError 等）✅ 推荐 |
| ~~`Form`~~ | ~~表单（已废弃，禁止使用）~~ ❌ |
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
npx shadcn-vue@latest add field    # ✅ 表单字段（推荐）
npx shadcn-vue@latest add select
```

## 表单组件规范

### 必须使用 Field 组件

**禁止**使用已废弃的 `Form` 组件（FormField, FormItem, FormLabel 等）。

**必须**使用 `Field` 组件体系：

```vue
<script setup lang="ts">
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Field as VeeField } from 'vee-validate'
</script>

<template>
  <VeeField v-slot="{ field, errors }" name="email">
    <Field :data-invalid="!!errors.length">
      <FieldLabel for="email">邮箱</FieldLabel>
      <Input id="email" v-bind="field" :aria-invalid="!!errors.length" />
      <FieldDescription>请输入有效的邮箱地址</FieldDescription>
      <FieldError v-if="errors.length" :errors="errors" />
    </Field>
  </VeeField>
</template>
```

### Field 组件优势

- 与表单库解耦，可配合 VeeValidate、TanStack Form 或原生表单使用
- 更灵活的布局支持（vertical/horizontal/responsive）
- 官方推荐，Form 组件已废弃

## 开发规范

1. 使用 `<script setup lang="ts">` 语法
2. 样式使用 Tailwind CSS，不写自定义 CSS
3. 组件类名使用 `cn()` 合并
4. 遵循 shadcn-vue 组件模式
5. 支持 TSX 语法（需要使用 `@vitejs/plugin-vue-jsx`）
6. 运行 `pnpm lint` 检查代码后再提交
7. 运行 `pnpm build`（包含类型检查）后再提交

## API 响应处理规则

项目的 axios 实例配置了响应拦截器，会自动解包后端返回的统一响应格式：

```typescript
// 后端返回格式
{
  success: boolean
  message: string
  data: T
}

// axios 拦截器会自动解包，API 调用直接得到 data
const result = await api.post('/some-endpoint', data)
// result 类型就是 T，而不是 { data: T }
```

**重要**：调用 API 时直接使用返回值，不要再访问 `.data`：

```typescript
// ✅ 正确
const result = await aiApi.rebuildVector({ projectId })
if (result.success) {
  console.log(result.data.requirements)
}

// ❌ 错误（重复访问 .data）
const response = await aiApi.rebuildVector({ projectId })
if (response.data.success) {  // 错误！response 已经是解包后的数据
  console.log(response.data.data.requirements)
}
```
