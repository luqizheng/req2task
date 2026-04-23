# @req2task/web

> **重要**: UI 设计规则请参考 [DESIGN-RULES.md](./DESIGN-RULES.md)

## 开发指南

### 启动开发服务器

```bash
pnpm dev:web
# 或直接
cd apps/web
pnpm dev
```

### 构建

```bash
pnpm build:web
# 或
cd apps/web && pnpm build
```

### 类型检查

```bash
cd apps/web && pnpm type-check
```

## 测试和检查

```bash
pnpm lint                # ESLint 检查
cd apps/web && pnpm type-check  # TypeScript 类型检查
```

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite 6
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **语言**: TypeScript

## 目录结构

```
apps/web/src/
├── components/      # 组件目录
│   └── common/      # 通用组件
│       ├── AppAvatar.vue    # 头像组件
│       ├── AppBadge.vue     # 徽章组件
│       ├── AppButton.vue    # 按钮组件
│       ├── AppCard.vue      # 卡片组件
│       ├── AppEmpty.vue     # 空状态组件
│       ├── AppForm.vue      # 表单组件
│       ├── AppLoading.vue   # 加载组件
│       ├── AppModal.vue     # 模态框组件
│       ├── AppPagination.vue# 分页组件
│       ├── AppTable.vue     # 表格组件
│       ├── AppTag.vue       # 标签组件
│       ├── StatCard.vue     # 统计卡片组件
│       └── index.ts         # 组件导出
├── views/           # 页面组件
│   └── HomeView.vue
├── stores/          # Pinia 状态管理
│   └── counter.ts
├── router/          # 路由配置
│   └── index.ts
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 通用组件

位于 `src/components/common/` 目录，提供开箱即用的基础 UI 组件：

| 组件 | 用途 |
|------|------|
| `AppAvatar` | 用户头像展示 |
| `AppBadge` | 状态徽章、计数徽章 |
| `AppButton` | 按钮，支持多种变体和状态 |
| `AppCard` | 卡片容器 |
| `AppEmpty` | 空状态占位 |
| `AppForm` | 表单容器和布局 |
| `AppLoading` | 加载状态指示器 |
| `AppModal` | 模态对话框 |
| `AppPagination` | 分页导航 |
| `AppTable` | 表格组件 |
| `AppTag` | 标签组件 |
| `StatCard` | 统计卡片，支持水平/垂直布局、图标、趋势指示器 |

使用方式：
```typescript
import { AppButton, AppCard, AppTable } from '@/components/common';
```

## SSE 通信规范

**强制要求**：所有 SSE (Server-Sent Events) 通信必须严格遵守 [SSE 通信协议](../../docs/reference/sse-protocol.md)。

### 核心规则

1. **事件类型**：必须使用 `metadata`、`content`、`message`、`done`、`error` 五种标准事件类型
2. **metadata 事件**：流开始时必须接收，包含会话上下文信息
3. **content 事件**：仅接收增量内容片段并追加到 UI
4. **结束标记**：成功结束接收 `data: [DONE]\n\n`，错误结束接收 `data: {"type": "error", "message": "<error>"}\n\n`
5. **AI 响应解析**：必须解包并重发为统一格式

### 关键文件

- `src/composables/useAiSubmit.ts` - SSE 流式提交和解析逻辑

## 开发规范

1. 使用 `<script setup lang="ts">` 语法
2. 状态管理使用 Pinia
3. 路由配置位于 `router/index.ts`
4. 遵循 SSE 协议定义的事件格式和错误码
5. 运行 lint 和 type-check 后再提交
6. UI 设计规则参见 [DESIGN-RULES.md](./DESIGN-RULES.md)

## API 调用规范

### Axios 拦截器

[src/api/axios.ts](src/api/axios.ts) 中的响应拦截器已配置为自动返回业务数据：

- 成功响应：直接返回 `apiResponse.data`（业务数据）
- 失败响应：抛出 `Error` 并自动处理 401 重定向

### 调用方式

API 返回的直接是业务数据，无需解构 `data` 属性：

```typescript
// ✅ 正确：直接使用返回值
const data = await api.get<MyType>('/endpoint');
currentValue.value = data;

// ❌ 错误：无需解构 { data }
const { data } = await api.get<MyType>('/endpoint');
currentValue.value = data;
```

### API 定义文件

| 文件 | 用途 |
|------|------|
| `src/api/axios.ts` | Axios 实例和拦截器配置 |
| `src/api/auth.ts` | 认证相关 API |
| `src/api/projects.ts` | 项目管理 API |
| `src/api/requirements.ts` | 需求管理 API |
| `src/api/tasks.ts` | 任务管理 API |
| `src/api/users.ts` | 用户管理 API |
| `src/api/ai.ts` | AI 功能 API |
