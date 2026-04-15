# dev-config

Shared development configuration package for req2task monorepo.

## 用途

- 统一管理 tsup 构建配置
- 避免包间配置重复和冲突
- 集中管理开发环境设置

## 使用方式

在需要使用统一构建配置的包中：

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup'
import { baseTsupConfig } from '@req2task/dev-config/tsup'

export default defineConfig([
  {
    ...baseTsupConfig[0],
    entry: ['src/index.ts'],
  },
  {
    ...baseTsupConfig[1],
    entry: ['src/index.ts'],
  },
])
```

## 导出

| 导出路径 | 说明 |
|---------|------|
| `@req2task/dev-config/tsup` | tsup 构建配置 |
| `@req2task/dev-config/tsconfig` | TypeScript 配置 |

## 当前支持

- dto 包（使用 tsup 构建 ESM + CJS）
