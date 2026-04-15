# 验证清单

- [x] Core 包目录结构符合规范（entities/、services/、bo/）
- [x] `packages/core/package.json` 配置正确（名称、版本、scripts）
- [x] `packages/core/tsconfig.json` 配置正确
- [x] `pnpm-workspace.yaml` 包含 core 包
- [x] `apps/service/package.json` 包含 `@req2task/core` 依赖
- [x] Service 可以正常导入并使用 Core 模块
- [x] `apps/web/.eslintrc.cjs` 包含禁止 core 依赖的规则
- [x] Web 项目无法添加 @req2task/core 依赖（lint 报错）
- [x] `pnpm build` 成功编译所有包
- [x] Core 包导出类型正常工作
