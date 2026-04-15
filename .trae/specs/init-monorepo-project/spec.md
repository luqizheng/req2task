# 项目初始化规格说明

## Why

建立AI驱动开发的基础架构，实现前后端分离、依赖统一管理、代码复用最大化。

## What Changes

- 创建pnpm workspace monorepo结构
- 初始化Vue3 + Vite + TypeScript前端项目
- 初始化NestJS + TypeORM后端服务
- 配置Git仓库和GitHooks
- 建立共享配置和依赖管理策略

## Impact

- 新增apps/web前端应用
- 新增apps/service后端服务
- 新增根目录workspace配置

## 架构决策

### 技术栈选型

| 层级 | 技术 | 版本要求 |
|------|------|---------|
| 包管理 | pnpm | >=9.0 |
| 前端框架 | Vue3 | Composition API优先 |
| 构建工具 | Vite | >=6.0 |
| 语言 | TypeScript | >=5.0 |
| 后端框架 | NestJS | >=10.0 |
| ORM | TypeORM | >=0.3 |
| 数据库 | SQLite开发/PostgreSQL生产 | - |

### 目录结构

```
req2task/
├── apps/
│   ├── web/              # Vue3前端应用
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── service/          # NestJS后端服务
│       ├── src/
│       ├── test/
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml   # Workspace配置
├── package.json          # 根包管理配置
├── .gitignore
├── .npmrc                # pnpm配置
├── .nvmrc               # Node版本
└── README.md
```

### 命名规范

- 包命名: `@req2task/web`、`@req2task/service`
- 组件: PascalCase (如UserProfile.vue)
- 工具函数: camelCase (如useAuth.ts)
- 文件夹: kebab-case (如components/user-profile)

## ADDED Requirements

### Requirement: pnpm Workspace配置

根目录需配置pnpm-workspace.yaml，声明apps/*为workspace。

#### Scenario: 依赖安装
- **WHEN** 在项目根目录执行 `pnpm install`
- **THEN** 自动安装所有workspace依赖，链接本地包

### Requirement: 前端项目结构

apps/web需包含完整Vue3 + Vite + TypeScript项目结构。

#### Scenario: 前端开发启动
- **WHEN** 执行 `pnpm --filter @req2task/web dev`
- **THEN** 启动Vite开发服务器，监听文件变化

### Requirement: 后端项目结构

apps/service需包含完整NestJS + TypeORM项目结构。

#### Scenario: 后端开发启动
- **WHEN** 执行 `pnpm --filter @req2task/service start:dev`
- **THEN** 启动NestJS开发服务器，支持热重载

### Requirement: Git配置

项目需配置.gitignore、.gitattributes等必要文件。

#### Scenario: Git提交检查
- **WHEN** 执行 `git commit`
- **THEN** 自动运行lint-staged进行提交前检查

### Requirement: Node版本管理

项目需声明.nvmrc指定Node版本。

#### Scenario: 版本切换
- **WHEN** 使用nvm切换到项目目录
- **THEN** 自动使用.nvmrc指定的Node版本
