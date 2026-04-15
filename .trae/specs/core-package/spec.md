# Core 包规范

## 目标
创建 `@req2task/core` 包，用于存放后端核心业务代码，实现服务层与业务逻辑的分离。

## 变更内容
- 新增 `packages/core` 目录及基础结构
- 引入 `@req2task/core` 包到 monorepo workspace
- 配置 TypeScript 编译设置
- 建立目录结构规范（entities/、services/、bo/）
- 在 service 项目中引用 core 包
- 添加 ESLint 规则阻止 web 项目依赖 core

## 影响范围
- **受影响的规范**: dto 包（core 可能依赖 dto）
- **受影响的代码**: 
  - `pnpm-workspace.yaml`（添加 core 包）
  - `apps/service/package.json`（新增 core 依赖）
  - `apps/web/package.json`（阻止依赖 core）
  - ESLint 配置（添加依赖规则）

## 新增需求

### 需求：Core 包结构
系统 SHALL 提供标准化的 core 包结构：
- `packages/core/src/entities/` - 数据库实体
- `packages/core/src/services/` - 业务服务类
- `packages/core/src/bo/` - 业务对象定义

#### 场景：Core 包创建
- **WHEN** 初始化 core 包时
- **THEN** 自动创建标准目录结构并配置 TypeScript

### 需求：Service 层依赖 Core
系统 SHALL 允许 service 应用依赖 core 包：

#### 场景：Service 导入 Core 服务
- **WHEN** service 模块导入 core 中的服务时
- **THEN** 正常工作且编译通过

### 需求：Web 层禁止依赖 Core
系统 SHALL 阻止 web 应用依赖 core 包：

#### 场景：Web 违规依赖检测
- **WHEN** web 项目尝试添加 `@req2task/core` 依赖时
- **THEN** ESLint 报错并阻止

### 需求：Core 包基础构建
系统 SHALL 提供可编译的 core 包基础结构：

#### 场景：Core 包编译
- **WHEN** 运行 `pnpm build` 时
- **THEN** core 包成功编译并生成类型定义

## 修改需求

### 需求：pnpm-workspace 配置
**修改内容**：将 `packages/core` 添加到 workspace 配置
**原因**：使 pnpm 可识别并管理 core 包依赖

### 需求：Service 依赖 Core
**修改内容**：在 `apps/service/package.json` 中添加 `"@req2task/core": "workspace:*"` 依赖
**原因**：service 需要使用 core 中的业务逻辑

## 技术约束
- Core 包必须导出 TypeScript 类型
- 使用 pnpm workspace 协议 `workspace:*` 管理内部依赖
- Core 包不应包含 NestJS 模块装饰器（保持框架无关性）
- Web 项目禁止依赖 core（ESLint 强制）
