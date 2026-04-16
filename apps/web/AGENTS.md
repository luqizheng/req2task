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
├── views/           # 页面组件
│   └── HomeView.vue
├── stores/          # Pinia 状态管理
│   └── counter.ts
├── router/          # 路由配置
│   └── index.ts
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 开发规范

1. 使用 `<script setup lang="ts">` 语法
2. 状态管理使用 Pinia
3. 路由配置位于 `router/index.ts`
4. 运行 lint 和 type-check 后再提交
5. UI 设计规则参见 [DESIGN-RULES.md](./DESIGN-RULES.md)
