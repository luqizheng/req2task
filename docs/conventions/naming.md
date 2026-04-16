---
last_updated: 2026-04-17
status: active
owner: req2task团队
---

# 命名规范

## 1. TypeScript 命名规范

### 1.1 标识符命名

| 类型 | 规范 | 示例 | 错误示例 |
|------|------|------|----------|
| 变量 | camelCase | `userName`, `isActive` | `user_name`, `UserName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` | `maxRetryCount` |
| 函数 | camelCase | `getUserById`, `calculateTotal` | `GetUserById` |
| 类 | PascalCase | `UserService`, `ProjectEntity` | `userService`, `user_service` |
| 接口 | PascalCase | `UserDTO`, `CreateProjectDto` | `IUser`, `userDto` |
| 类型别名 | PascalCase | `UserId`, `ProjectStatus` | `userId`, `TUser` |
| 枚举 | PascalCase | `ProjectStatus` | `project_status` |
| 枚举值 | camelCase | `ProjectStatus.ACTIVE` | `PROJECT_STATUS.ACTIVE` |
| 泛型参数 | PascalCase | `T`, `TData` | `t`, `t_data` |

### 1.2 命名空间与模块

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `user-service.ts`, `project-manager.ts` |
| 目录名 | kebab-case | `user-service/`, `auth-module/` |
| 命名空间 | PascalCase | `App.Utils`, `Services.Auth` |

### 1.3 布尔值命名

| 规范 | 示例 |
|------|------|
| 使用 is, are, has, should 前缀 | `isActive`, `hasPermission`, `shouldUpdate` |
| 使用否定前缀 | `isNotFound`, `isDisabled` |

## 2. Vue 命名规范

### 2.1 组件命名

| 类型 | 规范 | 示例 | 错误示例 |
|------|------|------|----------|
| 单文件组件 | PascalCase | `UserCard.vue` | `user-card.vue` |
| 视图组件 | PascalCase + View | `ProjectListView.vue` | `project-list.vue` |
| 布局组件 | PascalCase + Layout | `MainLayout.vue` | `main-layout.vue` |
| 业务组件 | PascalCase | `RequirementForm.vue` | `requirement_form.vue` |
| 通用组件 | PascalCase | `BaseButton.vue` | `base-button.vue` |

### 2.2 目录结构

```
components/
├── base/                    # 通用基础组件
│   ├── BaseButton.vue
│   ├── BaseInput.vue
│   └── BaseModal.vue
├── layout/                  # 布局组件
│   └── MainLayout.vue
└── features/               # 业务组件
    └── requirements/
        ├── RequirementCard.vue
        └── RequirementForm.vue
```

### 2.3 Props 命名

| 规范 | 示例 |
|------|------|
| 使用 camelCase | `projectId`, `isLoading` |
| 使用 kebab-case in template | `:project-id="id"` |

### 2.4 事件命名

| 规范 | 示例 |
|------|------|
| kebab-case | `@click`, `@update:model-value` |
| 组件事件 PascalCase | `onClick`, `onSubmit` |

### 2.5 Composables 命名

| 规范 | 示例 |
|------|------|
| use 前缀 | `useUser`, `useProject` |
| 返回值驼峰 | `const { userData, fetchUser } = useUser()` |

## 3. 数据库命名规范

### 3.1 表命名

| 规范 | 示例 |
|------|------|
| 单数形式 | `user`, `project`, `requirement` |
| snake_case | `user_story`, `task_dependency` |
| 关系表 | `raw_requirement_collection_requirements` |

### 3.2 字段命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通字段 | snake_case | `user_name`, `created_at` |
| 外键 | `{table_singular}_id` | `user_id`, `project_id` |
| 时间戳 | `{action}_at` | `created_at`, `updated_at`, `deleted_at` |
| 布尔值 | `is_{state}` | `is_active`, `is_deleted` |
| 枚举值 | snake_case | `in_progress`, `high_priority` |

### 3.3 索引命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通索引 | `idx_{table}_{column}` | `idx_users_email` |
| 唯一索引 | `uq_{table}_{column}` | `uq_projects_name` |
| 外键索引 | `fk_{table}_{ref_table}` | `fk_tasks_requirements` |
| 部分索引 | `idx_{table}_{column}_partial` | `idx_projects_deleted` |

### 3.4 约束命名

| 类型 | 规范 | 示例 |
|------|------|------|
| CHECK 约束 | `chk_{table}_{field}` | `chk_users_status` |
| 触发器 | `update_{table}_updated_at` | `update_projects_updated_at` |

## 4. API 路由命名规范

### 4.1 路由路径

| 规范 | 示例 |
|------|------|
| 全小写 | `/projects`, `/user-stories` |
| kebab-case | `/raw-requirement-collections` |
| 资源复数 | `/projects`, `/requirements` |
| 嵌套资源 | `/requirements/:id/user-stories` |
| 版本前缀 | `/api/v1/projects` |

### 4.2 HTTP 方法

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询 | `GET /projects` |
| POST | 创建 | `POST /projects` |
| PUT | 全量更新 | `PUT /projects/:id` |
| PATCH | 部分更新 | `PATCH /projects/:id` |
| DELETE | 删除 | `DELETE /projects/:id` |

### 4.3 动作命名

| 规范 | 示例 |
|------|------|
| 资源动作 | `/projects/:id/approve` |
| 批量操作 | `/projects/:id/members` |
| 关系操作 | `/projects/:id/members/:userId` |

## 5. 文件命名规范

### 5.1 后端文件

```
modules/
├── projects/
│   ├── dto/
│   │   ├── create-project.dto.ts
│   │   ├── update-project.dto.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── project.entity.ts
│   ├── services/
│   │   ├── projects.service.ts
│   │   └── projects.service.spec.ts
│   ├── controllers/
│   │   └── projects.controller.ts
│   ├── projects.module.ts
│   └── projects.constants.ts
```

### 5.2 前端文件

```
src/
├── api/
│   └── projects.ts
├── stores/
│   └── project.ts
├── views/
│   └── projects/
│       ├── ProjectListView.vue
│       └── ProjectDetailView.vue
├── components/
│   └── projects/
│       ├── ProjectCard.vue
│       └── ProjectForm.vue
└── composables/
    └── useProjects.ts
```

## 6. 测试文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 单元测试 | `{file}.spec.ts` | `projects.service.spec.ts` |
| 集成测试 | `{file}.integration.ts` | `auth.integration.ts` |
| E2E 测试 | `{feature}.e2e.ts` | `projects.e2e.ts` |

## 7. 配置与环境变量

### 7.1 环境变量

| 规范 | 示例 |
|------|------|
| UPPER_SNAKE_CASE | `DATABASE_HOST`, `API_KEY` |
| 前缀区分用途 | `LLM_`, `DB_`, `REDIS_` |

### 7.2 配置文件

| 类型 | 命名 |
|------|------|
| 环境配置 | `.env`, `.env.local` |
| TypeScript 配置 | `tsconfig.json` |
| ESLint 配置 | `.eslintrc.js` |
| Prettier 配置 | `.prettierrc` |
