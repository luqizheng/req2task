# 共享 DTO Package 规范

## Why

前后端分离架构中，Web 和 Service 需要共享数据传输对象定义。当前 Web 和 Service 各自定义 DTO，导致类型不一致、重复定义、维护困难。引入共享 DTO 包可实现类型单一来源，提升开发效率和类型安全。

## What Changes

* 在 `packages/dto` 创建共享 DTO 包

* 配置 TypeScript 同时输出 CJS 和 ESM 格式

* 为 Web 和 Service 分别配置类型引用

* 建立 DTO 命名和组织规范

## Impact

* 新增 `packages/dto` 包

* Web 和 Service 的 `package.json` 添加对 `@req2task/dto` 的依赖

* TypeScript 配置需要支持双模块格式输出

## 模块格式选择

| 格式             | 用途                  | Node.js 兼容性  |
| -------------- | ------------------- | ------------ |
| **ESM (.mjs)** | 现代浏览器、Vue/Vite      | Node.js 12+  |
| **CJS (.cjs)** | NestJS (Node.js 环境) | Node.js 所有版本 |

TypeScript 编译器可通过 `tsconfig` 配置输出两种格式，或使用构建工具（如 tsup、rollup）处理。

## ADDED Requirements

### Requirement: DTO 包结构

`packages/dto` 包需包含以下结构：

```
packages/dto/
├── src/
│   ├── index.ts           # 统一导出
│   ├── user/              # 按领域组织
│   │   ├── index.ts
│   │   ├── dto/           # 实际 DTO 定义
│   │   │   ├── create-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── types.ts      # 共享类型
│   └── common/           # 通用定义
│       ├── pagination.dto.ts
│       └── api-response.dto.ts
├── package.json
├── tsconfig.json         # ESM 配置
├── tsconfig.cjs.json     # CJS 配置
└── tsconfig.build.json   # 构建配置
```

### Requirement: 双格式输出

DTO 包需同时输出 ESM 和 CJS 格式：

* **ESM**: `dist/esm/index.js` + `dist/esm/**/*.d.ts`

* **CJS**: `dist/cjs/index.js` + `dist/cjs/**/*.d.ts`

`package.json` 需配置：

```json
{
  "name": "@req2task/dto",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

### Requirement: NestJS 使用 CJS

`apps/service` 使用 CommonJS 格式，通过 `require()` 导入：

```typescript
import { CreateUserDto } from '@req2task/dto';
// 编译后实际为 require('@req2task/dto')
```

### Requirement: Vue/Vite 使用 ESM

`apps/web` 使用 ESM 格式，通过 `import` 导入：

```typescript
import { CreateUserDto } from '@req2task/dto';
// Vite 会根据 package.json 的 module 字段解析
```

## MODIFIED Requirements

### Requirement: Web 依赖配置

`apps/web/package.json` 需添加：

```json
{
  "dependencies": {
    "@req2task/dto": "workspace:*"
  }
}
```

### Requirement: Service 依赖配置

`apps/service/package.json` 需添加：

```json
{
  "dependencies": {
    "@req2task/dto": "workspace:*"
  }
}
```

## 实现方案

### 采用 tsup

* 使用 [tsup](https://github.com/egoist/tsup) 处理双格式输出

* 配置简单，输出干净

* 支持 declaration 自动生成

`tsup.config.ts` 配置示例：

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  clean: true,
  outDir: 'dist',
})
```

## DTO 命名规范

* 文件名: kebab-case (如 `create-user.dto.ts`)

* 类名: PascalCase + Dto 后缀 (如 `CreateUserDto`)

* Response DTO: 添加 `Response` 后缀 (如 `UserResponseDto`)

* 请求 DTO: 添加 `Request` 前缀或无后缀 (如 `CreateUserRequestDto`)

## 文件清单

* [ ] `packages/dto/package.json`

* [ ] `packages/dto/tsconfig.json`

* [ ] `packages/dto/tsup.config.ts`

* [ ] `packages/dto/src/index.ts`

* [ ] `packages/dto/src/common/pagination.dto.ts`

* [ ] `packages/dto/src/common/api-response.dto.ts`

* [ ] `packages/dto/src/user/index.ts`

* [ ] `packages/dto/src/user/dto/create-user.dto.ts`

* [ ] `packages/dto/src/user/dto/user-response.dto.ts`

