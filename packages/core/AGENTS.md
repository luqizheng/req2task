# AGENTS.md - packages/core

## 包概述

`packages/core` 是 req2task 的后端核心业务代码包，提供实体定义和服务层。

## 依赖关系

- 被 `apps/service` (NestJS 后端) 依赖
- 使用 TypeORM 进行 ORM 映射
- 与 `packages/dto` 配合使用进行数据传输

## 目录结构

```
packages/core/src/
├── entities/           # TypeORM 实体定义
│   ├── user.entity.ts      # 用户实体
│   ├── project.entity.ts   # 项目实体
│   └── feature-module.entity.ts  # 功能模块实体
├── services/          # 业务服务层
│   └── user.service.ts     # 用户服务
├── bo/                # 业务对象
│   ├── index.ts
│   └── user.bo.ts
└── index.ts           # 导出入口
```

## 实体说明

### User 实体

- `UserRole` 枚举: `ADMIN`, `USER`, `PROJECT_MANAGER`
- 字段: id, username, email, displayName, role, passwordHash
- 自动时间戳: createdAt, updatedAt

### Project 实体

- `ProjectStatus` 枚举: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`
- 字段: id, name, description, projectKey, status, startDate, endDate, ownerId
- 关联: members (多对多 User), ownerId (外键)
- 自动时间戳: createdAt, updatedAt

### FeatureModule 实体

- 树形结构支持: parentId, parent, children
- 字段: id, name, description, moduleKey, sort, parentId, projectId
- 关联: project (多对一), parent/children (自关联)
- 自动时间戳: createdAt, updatedAt

## 开发说明

### 命名规范

- 实体文件: `*.entity.ts`
- 服务文件: `*.service.ts`
- 业务对象: `*.bo.ts`
- 使用 PascalCase 命名类和类型
- 使用 camelCase 命名变量和函数
- 数据库字段使用 snake_case

### TypeORM 使用

- 使用装饰器定义实体
- `PrimaryGeneratedColumn('uuid')` 生成 UUID 主键
- 使用 `CreateDateColumn` 和 `UpdateDateColumn` 自动管理时间戳
- 使用 `ManyToOne`/`OneToMany` 定义关系

### 添加新实体步骤

1. 在 `src/entities/` 创建 `*.entity.ts`
2. 在 `entities/index.ts` 导出
3. 在 `src/index.ts` 确保导出

### 添加新服务步骤

1. 在 `src/services/` 创建 `*.service.ts`
2. 在 `services/index.ts` 导出
3. 在 `src/index.ts` 确保导出

## 测试

- 测试文件应放在 `__tests__/` 目录
- 使用 Vitest 框架
- 命令: `pnpm test --filter @req2task/core`
