# 任务列表

## 任务 1：创建 Core 包基础结构
- [x] 创建 `packages/core` 目录
- [x] 初始化 `packages/core/package.json`
- [x] 配置 `packages/core/tsconfig.json`
- [x] 创建 `packages/core/src/entities/` 目录结构
- [x] 创建 `packages/core/src/services/` 目录结构
- [x] 创建 `packages/core/src/bo/` 目录结构
- [x] 创建基础入口文件 `packages/core/src/index.ts`

## 任务 2：配置 pnpm workspace
- [x] 更新 `pnpm-workspace.yaml` 添加 `packages/core`

## 任务 3：创建 Core 包示例代码
- [x] 创建示例 User 实体（`entities/user.entity.ts`）
- [x] 创建示例 UserService（`services/user.service.ts`）
- [x] 创建示例 UserBo（`bo/user.bo.ts`）
- [x] 导出所有模块（`src/index.ts`）

## 任务 4：配置 Service 层依赖 Core
- [x] 更新 `apps/service/package.json` 添加 `@req2task/core` 依赖
- [x] 更新 `apps/service/src/app.module.ts` 导入 Core 模块

## 任务 5：配置依赖规则阻止 Web 依赖 Core
- [x] 更新 `apps/web/package.json` 添加 eslint 插件规则
- [x] 创建 ESLint 配置 `apps/web/.eslintrc.cjs` 阻止 @req2task/core 依赖

## 任务 6：验证构建
- [x] 运行 `pnpm install` 安装依赖
- [x] 运行 `pnpm build` 验证编译
- [x] 验证 service 可以正常导入 core
- [x] 验证 lint 规则正常工作

## 任务依赖
- 任务 1 完成后才能开始任务 3
- 任务 2 完成后才能开始任务 4
- 任务 3、4 完成后才能开始任务 6
