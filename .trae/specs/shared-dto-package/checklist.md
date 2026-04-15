# Checklist - 共享 DTO Package

- [x] packages/dto/package.json 包含正确的 name、main、module、types、exports 配置
- [x] packages/dto/tsup.config.ts 配置同时输出 ESM 和 CJS 格式
- [x] packages/dto/tsconfig.json 配置正确
- [x] 构建后 dist/cjs 目录包含 .js 和 .d.ts 文件
- [x] 构建后 dist/esm 目录包含 .mjs 和 .d.mts 文件
- [x] apps/web 可以 import { CreateUserDto } from '@req2task/dto'
- [x] apps/service 可以 import { CreateUserDto } from '@req2task/dto'
- [x] Web 和 Service 的 DTO 类型保持一致
- [x] DTO 命名符合 PascalCase + Dto 后缀规范
