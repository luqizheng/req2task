# Sprint 13: 精简 User 与角色关系 + 修复 RawRequirement 关系

**计划类型**: 后端实施路线图
**目标**: 统一角色体系（移除 User.systemRole）+ RawRequirement → Requirement 从 1:1 改为 1:N
**预计时长**: 1 周 + 2 天
**状态**: ⏳ 待排期
**里程碑**: M6（角色体系重构里程碑）
**优先级**: P0（阻塞 Sprint 12 权限完善）

> **合并说明**: 原 Sprint 14（RawRequirement 关系修复）已合并到本 Sprint

---

## 1. 背景与目标

### 1.1 当前问题

| 问题 | 当前设计 | 影响 |
|------|----------|------|
| 角色概念混淆 | User.systemRole（单值）+ ProjectMemberRole（多值） | 权限判断复杂 |
| 角色定义不一致 | permission-workflow.md 定义 8 种角色，实际只实现 3 种 | 文档与代码脱节 |
| 权限判断冗余 | 先查 systemRole，再查 ProjectMemberRole | 性能损耗 |
| ADMIN 权限过重 | 系统管理员拥有所有项目权限 | 安全性风险 |

### 1.2 目标

- **统一角色体系**：只保留项目级角色
- **移除 systemRole**：User 实体不再包含角色字段
- **简化权限模型**：基于 ProjectMemberRole + Permission 细粒度控制
- **文档对齐**：PRD、设计文档、代码实现一致

---

## 2. 新角色体系设计

### 2.1 角色类型

| 角色 | 作用域 | 权限范围 |
|------|--------|----------|
| **系统管理员** | 全系统 | 系统配置、用户管理（特殊标记，非角色） |
| **项目经理** | 项目级 | 项目管理、成员管理 |
| **开发者** | 项目级 | 任务开发、模块编辑 |
| **需求分析师** | 项目级 | 需求编辑、用户故事编写 |
| **测试工程师** | 项目级 | 测试用例、验收测试 |

### 2.2 权限模型

```typescript
// 权限枚举
enum Permission {
  // 系统权限
  SYSTEM_USER_MANAGE = 'system:user:manage',
  SYSTEM_CONFIG = 'system:config',
  
  // 项目权限
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE_MEMBERS = 'project:manage_members',
  
  // 模块权限
  MODULE_VIEW = 'module:view',
  MODULE_EDIT = 'module:edit',
  
  // 需求权限
  REQUIREMENT_CREATE = 'requirement:create',
  REQUIREMENT_EDIT = 'requirement:edit',
  REQUIREMENT_DELETE = 'requirement:delete',
  REQUIREMENT_REVIEW = 'requirement:review',
  
  // 任务权限
  TASK_CREATE = 'task:create',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',
}

// 角色权限映射
const RolePermissions: Record<ProjectRole, Permission[]> = {
  PROJECT_MANAGER: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_MANAGE_MEMBERS,
    Permission.MODULE_VIEW,
    Permission.MODULE_EDIT,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_EDIT,
    Permission.REQUIREMENT_DELETE,
    Permission.REQUIREMENT_REVIEW,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
  ],
  DEVELOPER: [
    Permission.PROJECT_VIEW,
    Permission.MODULE_VIEW,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_EDIT,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
  ],
  REQUIREMENT_ANALYST: [
    Permission.PROJECT_VIEW,
    Permission.MODULE_VIEW,
    Permission.REQUIREMENT_CREATE,
    Permission.REQUIREMENT_EDIT,
    Permission.REQUIREMENT_DELETE,
  ],
  TESTER: [
    Permission.PROJECT_VIEW,
    Permission.MODULE_VIEW,
    Permission.REQUIREMENT_VIEW,
    Permission.TASK_VIEW,
    Permission.TEST_EXECUTE,
  ],
};
```

### 2.3 系统管理员特殊处理

```typescript
// User 实体 - 移除 systemRole，新增 isSystemAdmin
interface User {
  id: string
  username: string
  email: string
  passwordHash: string
  isSystemAdmin: boolean  // 替代 systemRole
  createdAt: Date
  updatedAt: Date
}

// 权限判断逻辑
function hasPermission(userId: string, projectId: string, permission: Permission): boolean {
  // 1. 系统管理员拥有所有权限
  const user = await userRepo.findById(userId)
  if (user.isSystemAdmin) return true
  
  // 2. 项目级权限判断
  const member = await projectMemberRepo.findByUserAndProject(userId, projectId)
  if (!member) return false
  
  return member.roles.some(role => RolePermissions[role].includes(permission))
}
```

---

## 3. 任务列表

### 3.1 后端任务

| 任务 | 预估 | 优先级 | 依赖 | 状态 |
|------|------|--------|------|------|
| 数据库迁移：User 表移除 systemRole，新增 isSystemAdmin | 4h | P0 | - | ⏳ |
| 数据库迁移：ProjectMemberRole 表结构调整 | 2h | P0 | 上游 | ⏳ |
| User 实体重构 | 2h | P0 | 上游 | ⏳ |
| 权限服务重构：移除 systemRole 依赖 | 6h | P0 | 上游 | ⏳ |
| 权限判断逻辑统一：基于 ProjectMemberRole | 4h | P0 | 上游 | ⏳ |
| API 修改：登录返回 isSystemAdmin 而非 systemRole | 2h | P1 | 上游 | ⏳ |
| 项目创建 API 修改：不再自动分配 PROJECT_MANAGER 系统角色 | 2h | P1 | 上游 | ⏳ |
| JWT Token 结构调整 | 2h | P1 | 上游 | ⏳ |
| 单元测试补充 | 4h | P1 | 上游 | ⏳ |

### 3.2 RawRequirement 关系修复任务

| 任务 | 预估 | 优先级 | 依赖 | 状态 |
|------|------|--------|------|------|
| 创建数据库迁移脚本 | 2h | P1 | - | ⏳ |
| 修改 Requirement 实体：新增 sourceRawRequirementId | 1h | P1 | 上游 | ⏳ |
| 修改 RawRequirement 实体：移除 generatedRequirement，新增 requirements | 1h | P1 | 上游 | ⏳ |
| 更新需求生成服务 | 4h | P1 | 上游 | ⏳ |
| 更新单元测试 | 2h | P1 | 上游 | ⏳ |

### 3.3 前端任务

| 任务 | 预估 | 优先级 | 依赖 | 状态 |
|------|------|--------|------|------|
| 用户列表/详情页：移除 systemRole 展示 | 2h | P1 | 后端完成 | ⏳ |
| 权限判断组件：统一使用 projectId + permission 模式 | 4h | P1 | 后端完成 | ⏳ |
| 项目成员管理 UI：支持多角色分配 | 3h | P1 | 后端完成 | ⏳ |
| 用户管理后台：系统管理员标记功能 | 3h | P1 | 后端完成 | ⏳ |
| 需求详情页：显示来源 RawRequirement 追溯（P2） | 2h | P2 | 后端完成 | ⏳ |
| RawRequirement 详情页：显示关联需求列表（P2） | 2h | P2 | 后端完成 | ⏳ |

**后端总工时**: 41h（约 6 人天）
**前端总工时**: 12h + 4h（P2）= 16h
**总计**: 57h（约 8 人天）

---

## 4. 数据库迁移

### 4.1 迁移脚本

```sql
-- 1. User 表：移除 system_role，新增 is_system_admin
ALTER TABLE "user" DROP COLUMN IF EXISTS "system_role";
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_system_admin" BOOLEAN NOT NULL DEFAULT false;

-- 2. 数据迁移：将 ADMIN 用户迁移为 is_system_admin = true
UPDATE "user" SET "is_system_admin" = true WHERE "system_role" = 'ADMIN';

-- 3. ProjectMember 表结构调整（可选，根据需要）
-- 保持 ProjectMemberRole 表结构不变
```

### 4.2 回滚方案

```sql
-- 回滚脚本
ALTER TABLE "user" ADD COLUMN "system_role" VARCHAR(50);
UPDATE "user" SET "system_role" = 'ADMIN' WHERE "is_system_admin" = true;
ALTER TABLE "user" DROP COLUMN IF EXISTS "is_system_admin";
```

---

## 5. API 变更

### 5.1 变更的 API

| API | 变更内容 |
|-----|----------|
| POST /auth/login | 响应中 systemRole → isSystemAdmin |
| GET /users/:id | 移除 systemRole 字段 |
| PUT /users/:id | 移除 systemRole 字段 |
| 新增 PATCH /users/:id/admin | 设置/取消系统管理员 |
| GET /projects/:id/members | 响应结构不变 |
| GET /projects/:id/members/:userId/roles | 响应结构不变 |

### 5.2 响应示例

```json
// POST /auth/login 响应
{
  "token": "xxx",
  "user": {
    "id": "uuid",
    "username": "john",
    "email": "john@example.com",
    "isSystemAdmin": false
  }
}
```

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 迁移失败 | 用户无法登录 | 灰度发布，保留回滚脚本 |
| 权限遗漏 | 某些操作无权限 | 全面回归测试 |
| 前端适配遗漏 | 页面异常 | 完整 UI 测试 |
| 文档不同步 | 后续开发困惑 | 同步更新 PRD 和设计文档 |

---

## 7. 验收标准

- [ ] User.systemRole 字段已移除
- [ ] isSystemAdmin 字段正常工作
- [ ] 登录用户可正常访问项目资源
- [ ] 项目级权限判断正常
- [ ] 系统管理员可访问所有项目
- [ ] 前端权限组件正常工作
- [ ] 单元测试通过率 100%
- [ ] 集成测试通过
- [ ] 文档已更新

---

## 8. 排期安排（合并 Sprint 14）

### 合并后 Sprint 13 安排

| 日期 | 内容 |
|------|------|
| **第 1 天** | 数据库迁移（User.systemRole → isSystemAdmin）、User 实体重构 |
| **第 2 天** | 权限服务重构、API 修改、JWT Token 调整 |
| **第 3 天** | RawRequirement 关系修复（1:1 → 1:N）、需求生成服务更新 |
| **第 4 天** | 单元测试、前端权限组件适配 |
| **第 5 天** | 前端 UI 适配（用户管理、成员管理） |
| **第 6-7 天** | 集成测试、回归测试、文档更新 |

### 任务分组

| 分组 | 任务 |
|------|------|
| **角色体系重构** | User.systemRole 移除、权限模型统一、JWT 调整 |
| **RawRequirement 修复** | 实体修改、迁移脚本、服务更新 |
| **前端适配** | 权限组件、用户管理 UI、追溯功能 |

---

## 9. 依赖关系

```
前置依赖:
- Sprint 11 高级功能 - 上 完成
- Sprint 12 高级功能 - 下（可并行）

本 Sprint 完成后:
- 通知系统开发（权限模型已稳定）
- 前端成员管理 UI 开发

包含任务（原 Sprint 14）:
- RawRequirement → Requirement 关系修复（1:1 → 1:N）
```

---

**上一 Sprint**: [Sprint 12: 高级功能 - 下](sprint-12-implementation-advanced-part2.md)
**下一 Sprint**: [Sprint 14: 通知系统](sprint-14-implementation-notification.md)（待创建）
