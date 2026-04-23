---
last_updated: 2026-04-17
status: draft
owner: req2task团队
---

# 项目用户系统实施计划

## 1. 概述

本计划基于 `docs/prd/project-user-system.md` 需求文档，实现双层权限体系（系统级角色 + 项目级角色）。

## 2. 实施范围

### 2.1 系统级角色

| 角色            | 权限                     |
| --------------- | ------------------------ |
| ADMIN           | 所有系统操作、用户管理   |
| PROJECT_MANAGER | 创建项目、访问参与的项目 |
| USER            | 访问参与的项目           |

### 2.2 项目级角色

| 角色                | 权限             |
| ------------------- | ---------------- |
| PROJECT_MANAGER     | 项目全部管理权限 |
| DEVELOPER           | 任务开发相关权限 |
| REQUIREMENT_ANALYST | 需求分析相关权限 |
| TESTER              | 测试相关权限     |

## 3. 实现任务

### T1: 实体扩展

**T1.1 更新 User 实体添加 systemRole 字段**

- 文件: `packages/core/src/entities/user.entity.ts`
- 添加字段: `systemRole` (enum: ADMIN, PROJECT_MANAGER, USER)
- 添加字段: `roleGrantedById` (UUID, nullable) - 最近授权人
- 添加字段: `roleGrantedAt` (datetime, nullable) - 最近授权时间
- 说明: 根据 PRD PUS-5.1，系统角色直接作为 User 属性字段

**T1.2 创建 ProjectMember 实体**

- 文件: `packages/core/src/entities/project-member.entity.ts`
- 字段: id, userId, projectId, roles(array), isOwner, joinedAt, joinedById
- 关联: User, Project, ProjectMemberRole (OneToMany)

**T1.3 创建 ProjectMemberRole 实体**

- 文件: `packages/core/src/entities/project-member-role.entity.ts`
- 字段: id, projectMemberId, role(enum), grantedById, createdAt
- 关联: ProjectMember (ManyToOne)

### T2: DTO 定义

**T2.1 系统角色 DTO**

- `GetUserSystemRoleDto`
- `AssignSystemRoleDto`
- `SystemRoleResponseDto`

**T2.2 项目成员 DTO**

- `AddProjectMemberDto`
- `UpdateProjectMemberDto`
- `ProjectMemberResponseDto`
- `ProjectMemberRoleDto`

### T3: 枚举定义

更新 `packages/dto/src/enums/user-role.enum.ts`:

- 重命名/扩展现有 `UserRole` 为系统角色枚举: ADMIN, PROJECT_MANAGER, USER
- 说明: 根据 PRD PUS-3.1 和 PUS-5.1，系统角色作为 User 属性字段

创建 `packages/dto/src/roles.ts`:

- `ProjectRole`: PROJECT_MANAGER, DEVELOPER, REQUIREMENT_ANALYST, TESTER
- `SystemPermission`: 权限编码枚举
- `ProjectPermission`: 项目权限编码枚举

### T4: 权限服务

**T4.1 创建 PermissionService**

- 文件: `apps/service/src/shared/permission/permission.service.ts`
- 方法:
  - `hasSystemPermission(userId, permission): boolean`
  - `hasProjectPermission(userId, projectId, permission): boolean`
  - `getAccessibleProjects(userId): Project[]`
  - `canAccessResource(userId, projectId): boolean`
  - `canRemoveProjectManager(projectId, memberId): boolean`

**T4.2 创建 ProjectMemberService**

- 文件: `apps/service/src/projects/project-member/project-member.service.ts`
- 方法:
  - `addMember(projectId, userId, roles, addedById): ProjectMember`
  - `removeMember(projectId, memberId, removedById): void`
  - `updateMemberRoles(projectId, memberId, roles, updatedById): ProjectMember`
  - `getProjectMembers(projectId): ProjectMember[]`
  - `getUserProjects(userId): Project[]`
  - `getUserProjectRoles(userId): UserProjectRole[]`

### T5: 守卫和装饰器

**T5.1 创建权限守卫**

- `SystemRoleGuard`: 校验系统角色
- `ProjectRoleGuard`: 校验项目角色
- `ProjectMemberGuard`: 校验项目成员身份

**T5.2 创建权限装饰器**

- `@RequireSystemRole(...roles)`
- `@RequireProjectRole(...roles)`
- `@RequirePermission(permission)`

### T6: API 实现

**T6.1 系统角色 API**

- `GET /api/v1/users/:id/system-role` - 获取用户系统角色
- `PUT /api/v1/users/:id/system-role` - 分配系统角色
- `GET /api/v1/system-roles` - 获取系统角色列表

**T6.2 项目成员 API**

- `GET /api/v1/projects/:projectId/members` - 获取项目成员列表
- `POST /api/v1/projects/:projectId/members` - 添加项目成员
- `PUT /api/v1/projects/:projectId/members/:userId` - 更新成员角色
- `DELETE /api/v1/projects/:projectId/members/:userId` - 移除项目成员
- `GET /api/v1/projects/:projectId/members/:userId/roles` - 获取成员的项目角色

**T6.3 项目角色 API**

- `GET /api/v1/project-roles` - 获取项目角色列表
- `GET /api/v1/projects/:projectId/roles` - 获取项目的角色配置

**T6.4 用户项目查询 API**

- `GET /api/v1/users/:id/projects` - 获取用户参与的项目
- `GET /api/v1/users/:id/project-roles` - 获取用户在所有项目的角色

### T7: 数据库表设计

1. users 表添加字段: system_role, role_granted_by_id, role_granted_at
2. 新建 project_members 表
3. 新建 project_member_roles 表
4. projects 表添加 owner_id 外键

### T8: 模块更新

**T8.1 更新 UsersModule**

- 更新 User 实体（添加 systemRole 字段）
- 注册 UserService（如有系统角色管理相关方法）

**T8.2 更新 ProjectsModule**

- 导入 ProjectMember, ProjectMemberRole 实体
- 注册 ProjectMemberService, PermissionService
- 导出 ProjectMemberService

## 4. 验收标准

- [ ] ADMIN 可分配系统角色
- [ ] 项目创建者自动成为 PROJECT_MANAGER 和 Owner
- [ ] PROJECT_MANAGER 可管理项目成员
- [ ] USER 只能访问参与的项目
- [ ] ADMIN 可访问所有项目
- [ ] 最后一个项目经理不可移除
- [ ] 用户可拥有多个项目角色

## 5. 文件清单

```
packages/core/src/entities/
├── user.entity.ts                 [更新 - 添加 systemRole 字段]
├── project-member.entity.ts       [新建]
└── project-member-role.entity.ts  [新建]

packages/dto/src/
├── enums/
│   └── user-role.enum.ts          [更新 - 调整为系统角色枚举]
├── roles.ts                       [新建]
└── index.ts                       [更新]

apps/service/src/
├── shared/
│   └── permission/
│       ├── permission.service.ts  [新建]
│       ├── guards/
│       │   ├── system-role.guard.ts      [新建]
│       │   ├── project-role.guard.ts     [新建]
│       │   └── project-member.guard.ts   [新建]
│       └── decorators/
│           ├── require-system-role.decorator.ts  [新建]
│           ├── require-project-role.decorator.ts [新建]
│           └── require-permission.decorator.ts    [新建]
├── users/
│   └── controllers/
│       └── system-role.controller.ts   [新建]
└── projects/
    ├── controllers/
    │   └── project-member.controller.ts [新建]
    └── services/
        └── project-member.service.ts    [新建]
```

## 6. 依赖关系

```
User 实体 (扩展 systemRole 字段) ───> UsersModule

ProjectMember 实体 ──┬──> User 实体
                    ├──> Project 实体
                    └──> ProjectsModule

PermissionService ──┬──> User 实体 (systemRole 字段)
                    ├──> ProjectMember 实体
                    ├──> ProjectMemberRole 实体
                    └──> Project 实体

ProjectMemberService ──┬──> ProjectMember 实体
                      ├──> ProjectMemberRole 实体
                      ├──> PermissionService
                      └──> ProjectsModule
```

## 7. 风险与注意事项

1. **向后兼容**: ADMIN 角色可同时访问系统级和项目级资源
2. **事务处理**: 项目成员操作需要在事务中执行
3. **权限缓存**: 考虑添加权限缓存提升性能
