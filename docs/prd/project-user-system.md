# 项目成员系统

## PMS-1. 产品概述

项目成员系统管理用户与项目之间的多对多关系，支持用户在同一项目中担任多个角色，实现精细化的项目协作管理。

---

## PMS-2. 数据模型

### PMS-2.1 ProjectMember 实体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 主键 |
| userId | UUID | 是 | 用户ID |
| projectId | UUID | 是 | 项目ID |
| roles | array[enum] | 是 | 项目角色列表 |
| isOwner | boolean | 是 | 是否项目所有者 |
| joinedAt | datetime | 是 | 加入时间 |
| joinedById | UUID | 是 | 邀请人ID |

### PMS-2.2 ProjectMemberRole 实体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 主键 |
| projectMemberId | UUID | 是 | 项目成员ID |
| role | enum | 是 | 项目角色 |
| grantedById | UUID | 是 | 授权人ID |
| createdAt | datetime | 是 | 创建时间 |

### PMS-2.3 项目角色

| 角色编码 | 名称 | 权限 |
|----------|------|------|
| PROJECT_MANAGER | 项目经理 | 项目全部管理权限 |
| DEVELOPER | 开发工程师 | 任务开发相关权限 |
| REQUIREMENT_ANALYST | 需求分析师 | 需求分析相关权限 |
| TESTER | 测试工程师 | 测试相关权限 |

---

## PMS-3. 角色分配规则

| 规则 | 说明 |
|------|------|
| 多角色原则 | 每个用户在项目中可拥有多个角色 |
| 自动授权 | 项目创建者自动成为 OWNER 和 PROJECT_MANAGER |
| 角色分配 | 只有 PROJECT_MANAGER 可分配项目角色 |
| 项目必经理 | 每个项目必须至少保留一个项目经理 |

---

## PMS-4. 业务流程

### PMS-4.1 创建项目

```
1. 用户提交创建项目请求
2. 创建项目记录
3. 自动创建 ProjectMember：
   - 用户自动成为 PROJECT_MANAGER
   - 用户自动标记 isOwner = true
```

### PMS-4.2 添加成员

```
1. PROJECT_MANAGER 提交添加成员请求
2. 校验权限
3. 检查用户是否已在项目中
4. 创建 ProjectMember 记录
```

### PMS-4.3 移除成员

```
1. PROJECT_MANAGER 提交移除成员请求
2. 校验权限
3. 如果是唯一 PROJECT_MANAGER，拒绝操作
4. 移除 ProjectMember 记录
```

---

## PMS-5. API 接口

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/projects/:projectId/members` | GET | 获取项目成员列表 |
| `/projects/:projectId/members` | POST | 添加项目成员 |
| `/projects/:projectId/members/:userId` | PUT | 更新成员角色 |
| `/projects/:projectId/members/:userId` | DELETE | 移除项目成员 |
| `/projects/:projectId/members/:userId/roles` | GET | 获取成员的项目角色 |
| `/projects/:projectId/roles` | GET | 获取项目的角色配置 |
| `/users/:id/projects` | GET | 获取用户参与的项目 |

---

## PMS-6. 数据模型关系

```
User（用户）
    │
    └── ProjectMember（项目成员）
            │
            ├── ProjectMember.userId → User.id
            ├── ProjectMember.projectId → Project.id
            │
            └── ProjectMemberRole（成员角色）
                    │
                    ├── ProjectMemberRole.projectMemberId → ProjectMember.id
                    └── ProjectMemberRole.role → ProjectRole

Project（项目）
    │
    └── Project.ownerId → User.id
```

---

**相关文档**：[用户管理系统](user-management.md) - 系统用户和系统角色定义
