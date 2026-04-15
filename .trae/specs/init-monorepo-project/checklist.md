# Checklist - 项目初始化验收标准

- [x] pnpm-workspace.yaml正确配置apps/*为workspace
- [x] 根目录package.json声明"name": "req2task"
- [x] .npmrc配置shamefully-hoist和auto-install-peers
- [x] .nvmrc指定Node版本>=20.0
- [x] apps/web包含完整的package.json、vite.config.ts、tsconfig.json
- [x] apps/web/src目录包含main.ts和App.vue入口文件
- [x] apps/service包含完整的package.json和tsconfig.json
- [x] apps/service/src包含main.ts和app.module.ts入口模块
- [x] .gitignore正确忽略node_modules、dist、.env等文件
- [x] package.json包含lint-staged配置
- [x] pnpm install成功安装所有依赖
- [x] pnpm --filter @req2task/web build成功构建前端
- [x] pnpm --filter @req2task/service build成功构建后端
