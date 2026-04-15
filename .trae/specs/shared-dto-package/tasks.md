# Tasks - 共享 DTO Package

- [x] Task 1: 创建 DTO 包基础结构
  - [x] 创建 packages/dto 目录
  - [x] 创建 package.json，配置 name: @req2task/dto
  - [x] 配置 main/module/types/exports 字段

- [x] Task 2: 配置 TypeScript 双格式输出
  - [x] 安装 tsup 依赖
  - [x] 创建 tsconfig.json
  - [x] 创建 tsup.config.ts 配置 ESM + CJS 双格式
  - [x] 添加构建脚本到 package.json

- [x] Task 3: 创建 DTO 定义
  - [x] 创建 src/index.ts 统一导出
  - [x] 创建 src/common/pagination.dto.ts
  - [x] 创建 src/common/api-response.dto.ts
  - [x] 创建 src/user/index.ts
  - [x] 创建 src/user/dto/create-user.dto.ts
  - [x] 创建 src/user/dto/user-response.dto.ts

- [x] Task 4: 集成到 Web
  - [x] 在 apps/web/package.json 添加 @req2task/dto 依赖
  - [x] 运行 pnpm install
  - [x] 验证导入和使用

- [x] Task 5: 集成到 Service
  - [x] 在 apps/service/package.json 添加 @req2task/dto 依赖
  - [x] 运行 pnpm install
  - [x] 验证导入和使用

- [x] Task 6: 验证构建
  - [x] 运行 pnpm build --filter @req2task/dto
  - [x] 验证 dist/cjs 和 dist/esm 输出
  - [x] 验证类型声明文件生成
