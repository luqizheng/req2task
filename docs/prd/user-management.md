# 用户管理系统

## UM-1. 产品概述

### UM-1.1 产品定位

用户管理系统是 req2task 平台的基础支撑模块，负责平台用户的生命周期管理、身份认证、角色权限控制和安全审计，为所有业务功能提供身份基础。

### UM-1.2 目标用户

| 用户类型 | 使用场景 |
|----------|----------|
| 系统管理员 | 平台运维、用户管理、权限配置 |
| 项目管理员 | 成员管理、项目配置 |
| 业务用户 | 日常需求管理、任务协作 |

### UM-1.3 核心价值

- 统一身份认证：单点登录、多因素认证
- 精细化权限控制：角色+资源+操作三维权限模型
- 用户生命周期管理：入职-在职-离职全流程
- 安全审计：操作日志、异常行为检测

---

## UM-2. 功能范围

### UM-2.1 功能清单

| 功能模块 | 功能点 | 优先级 |
|----------|--------|--------|
| 用户管理 | 用户CRUD、批量导入导出、状态管理 | P0 |
| 认证管理 | 登录登出、密码管理、Token管理 | P0 |
| 角色管理 | 系统角色、业务角色、自定义角色 | P0 |
| 权限管理 | 权限分配、权限组、资源权限配置 | P0 |
| 组织架构 | 部门管理、人员归属、汇报关系 | P1 |
| 审计日志 | 登录日志、操作日志、异常告警 | P1 |
| 安全设置 | 密码策略、会话管理、IP白名单 | P1 |
| 个人信息 | 个人资料修改、头像上传、偏好设置 | P2 |

---

## UM-3. 用户模型

### UM-3.1 用户实体

| 字段名 | 类型 | 必填 | 说明 | 业务规则 |
|--------|------|------|------|----------|
| id | UUID | 是 | 用户唯一编号 | 系统自动生成 |
| username | string(50) | 是 | 用户名 | 唯一，字母数字下划线，3-20位 |
| email | string(255) | 是 | 邮箱 | 唯一，有效邮箱格式 |
| phone | string(20) | 否 | 手机号 | 可选，有效手机格式 |
| passwordHash | string(255) | 是 | 密码哈希 | bcrypt加密，永不明文存储 |
| realName | string(100) | 是 | 真实姓名 | 用于显示 |
| avatar | string(500) | 否 | 头像URL | 可选，默认gravatar |
| status | enum | 是 | 账号状态 | active/inactive/locked/disabled |
| departmentId | UUID | 否 | 所属部门ID | 引用Department |
| position | string(100) | 否 | 职位 | 如"产品经理" |
| employeeNo | string(50) | 否 | 员工编号 | 可用于工号绑定 |
| managerId | UUID | 否 | 上级ID | 汇报关系 |
| emailVerified | boolean | 是 | 邮箱已验证 | 默认false |
| phoneVerified | boolean | 是 | 手机已验证 | 默认false |
| mfaEnabled | boolean | 是 | 开启MFA | 默认false |
| mfaSecret | string(255) | 否 | MFA密钥 | 加密存储 |
| lastLoginAt | datetime | 否 | 最后登录时间 | 自动更新 |
| lastLoginIp | string(45) | 否 | 最后登录IP | IPv6支持 |
| passwordChangedAt | datetime | 是 | 密码修改时间 | 自动更新 |
| passwordExpiresAt | datetime | 否 | 密码过期时间 | 90天后过期，可配置 |
| loginFailCount | integer | 是 | 连续失败次数 | 超过5次锁定账户 |
| lockedUntil | datetime | 否 | 锁定截止时间 | 为空表示未锁定 |
| createdById | UUID | 是 | 创建人ID | 系统用户 |
| createdAt | datetime | 是 | 创建时间 | 系统自动生成 |
| updatedAt | datetime | 是 | 更新时间 | 系统自动更新 |
| deletedAt | datetime | 否 | 删除时间 | 软删除标记 |

### UM-3.2 部门实体

| 字段名 | 类型 | 必填 | 说明 | 业务规则 |
|--------|------|------|------|----------|
| id | UUID | 是 | 部门唯一编号 | 系统自动生成 |
| name | string(100) | 是 | 部门名称 | 唯一 |
| code | string(50) | 是 | 部门编码 | 唯一，用于系统集成 |
| parentId | UUID | 否 | 父部门ID | 支持多级部门 |
| leaderId | UUID | 否 | 部门负责人ID | 引用User |
| sortOrder | integer | 是 | 排序 | 默认0 |
| status | enum | 是 | 部门状态 | active/inactive |
| createdAt | datetime | 是 | 创建时间 | 系统自动生成 |
| updatedAt | datetime | 是 | 更新时间 | 系统自动更新 |

---

## UM-4. 角色模型

### UM-4.1 角色实体

| 字段名 | 类型 | 必填 | 说明 | 业务规则 |
|--------|------|------|------|----------|
| id | UUID | 是 | 角色唯一编号 | 系统自动生成 |
| code | string(50) | 是 | 角色编码 | 唯一，系统角色不可改 |
| name | string(100) | 是 | 角色名称 | 唯一 |
| description | string(500) | 否 | 角色描述 | 可选 |
| roleType | enum | 是 | 角色类型 | system/custom |
| status | enum | 是 | 角色状态 | active/inactive |
| isDefault | boolean | 是 | 默认角色 | 新用户自动授予 |
| sortOrder | integer | 是 | 排序 | 默认0 |
| createdById | UUID | 是 | 创建人ID | 系统管理员 |
| createdAt | datetime | 是 | 创建时间 | 系统自动生成 |
| updatedAt | datetime | 是 | 更新时间 | 系统自动更新 |

### UM-4.2 系统预置角色

| 角色编码 | 角色名称 | 描述 | 权限范围 |
|----------|----------|------|----------|
| SUPER_ADMIN | 超级管理员 | 系统最高权限 | 所有权限 |
| SYS_ADMIN | 系统管理员 | 系统配置管理 | 系统管理全部 |
| PROJECT_ADMIN | 项目管理员 | 项目级管理 | 项目管理全部 |
| PRODUCT_MANAGER | 产品经理 | 需求管理 | 需求相关全部 |
| BUSINESS_ANALYST | 需求分析师 | 需求分析 | 需求读写 |
| DEVELOPER | 开发工程师 | 开发任务 | 任务开发相关 |
| TESTER | 测试工程师 | 测试任务 | 测试相关 |
| VIEWER | 访客 | 只读访问 | 只读 |

### UM-4.3 用户角色关联

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 主键 |
| userId | UUID | 是 | 用户ID |
| roleId | UUID | 是 | 角色ID |
| scopeType | enum | 是 | 权限范围类型 |
| scopeId | UUID | 否 | 权限范围ID |
| grantedById | UUID | 是 | 授权人ID |
| expiresAt | datetime | 否 | 过期时间，为空永久 |
| createdAt | datetime | 是 | 创建时间 |

---

## UM-5. 权限模型

### UM-5.1 权限实体

| 字段名 | 类型 | 必填 | 说明 | 业务规则 |
|--------|------|------|------|----------|
| id | UUID | 是 | 权限唯一编号 | 系统自动生成 |
| code | string(100) | 是 | 权限编码 | 唯一，格式：模块:操作 |
| name | string(100) | 是 | 权限名称 | 用于显示 |
| description | string(500) | 否 | 权限描述 | 可选 |
| module | string(50) | 是 | 所属模块 | 如：user、project、requirement |
| action | string(50) | 是 | 操作类型 | create/read/update/delete/execute |
| resourceType | string(50) | 是 | 资源类型 | 如：User、Project、Requirement |
| isSystem | boolean | 是 | 系统内置 | true不可删除 |
| sortOrder | integer | 是 | 排序 | 默认0 |
| createdAt | datetime | 是 | 创建时间 | 系统自动生成 |

### UM-5.2 权限定义示例

| 权限编码 | 权限名称 | 模块 | 操作 |
|----------|----------|------|------|
| user:create | 创建用户 | user | create |
| user:read | 查看用户 | user | read |
| user:update | 更新用户 | user | update |
| user:delete | 删除用户 | user | delete |
| project:create | 创建项目 | project | create |
| project:read | 查看项目 | project | read |
| project:manage | 管理项目 | project | execute |
| requirement:create | 创建需求 | requirement | create |
| requirement:read | 查看需求 | requirement | read |
| requirement:update | 更新需求 | requirement | update |
| requirement:delete | 删除需求 | requirement | delete |
| requirement:approve | 审批需求 | requirement | execute |

### UM-5.3 角色权限关联

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 主键 |
| roleId | UUID | 是 | 角色ID |
| permissionId | UUID | 是 | 权限ID |
| createdAt | datetime | 是 | 创建时间 |

---

## UM-6. 认证管理

### UM-6.1 登录流程

```
1. 用户输入用户名/邮箱 + 密码
2. 系统校验：
   - 账号是否存在
   - 账号状态是否正常（active）
   - 账户是否被锁定
   - 密码是否正确
3. 登录成功：
   - 生成JWT Access Token（15分钟）
   - 生成Refresh Token（7天）
   - 更新最后登录时间和IP
   - 重置登录失败计数
4. 返回Token给客户端
```

### UM-6.2 多因素认证（MFA）

| 认证方式 | 配置项 | 说明 |
|----------|--------|------|
| TOTP | 绑定Google Authenticator | 6位动态口令，30秒有效 |
| Email | 邮箱验证码 | 5分钟有效 |
| SMS | 手机验证码 | 5分钟有效（需第三方服务） |

### UM-6.3 密码策略

| 策略项 | 默认值 | 可配置 |
|--------|--------|--------|
| 最小长度 | 8位 | 是 |
| 最大长度 | 32位 | 是 |
| 必须包含大写字母 | 是 | 是 |
| 必须包含小写字母 | 是 | 是 |
| 必须包含数字 | 是 | 是 |
| 必须包含特殊字符 | 否 | 是 |
| 密码过期天数 | 90天 | 是 |
| 历史密码记录 | 5个 | 是 |
| 登录失败锁定次数 | 5次 | 是 |
| 锁定时长 | 30分钟 | 是 |

---

## UM-7. 会话管理

### UM-7.1 Token结构

**Access Token (JWT)**
```json
{
  "sub": "user-uuid",
  "username": "john",
  "roles": ["ADMIN", "DEVELOPER"],
  "permissions": ["user:read", "project:create"],
  "exp": 1712345678,
  "iat": 1712344578,
  "iss": "req2task"
}
```

**Refresh Token**
- 存储于数据库或Redis
- 有效期7天
- 支持续期和主动失效

### UM-7.2 会话策略

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| Access Token有效期 | 15分钟 | 短期令牌 |
| Refresh Token有效期 | 7天 | 长期令牌 |
| 最大并发会话数 | 3 | 超出踢出旧会话 |
| 会话超时时间 | 30分钟 | 无操作自动登出 |
| 单设备登录 | 否 | 可配置 |

---

## UM-8. 审计日志

### UM-8.1 登录日志

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| userId | UUID | 用户ID |
| username | string | 用户名 |
| eventType | enum | login/logout/failed_login/mfa_verify |
| ip | string | IP地址 |
| userAgent | string | 浏览器UA |
| deviceInfo | string | 设备信息 |
| location | string | 地理位置 |
| status | enum | success/failure |
| failureReason | string | 失败原因 |
| createdAt | datetime | 发生时间 |

### UM-8.2 操作日志

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| userId | UUID | 操作人ID |
| username | string | 操作人用户名 |
| module | string | 操作模块 |
| action | string | 操作动作 |
| resourceType | string | 资源类型 |
| resourceId | UUID | 资源ID |
| oldValue | json | 变更前值 |
| newValue | json | 变更后值 |
| ip | string | IP地址 |
| userAgent | string | 浏览器UA |
| requestId | string | 请求追踪ID |
| createdAt | datetime | 操作时间 |

### UM-8.3 记录的操作类型

| 模块 | 操作 | 记录内容 |
|------|------|----------|
| 用户 | create/update/delete/disable/enable | 用户信息变更 |
| 用户 | password_change/reset | 密码变更 |
| 用户 | role_assign/role_revoke | 角色变更 |
| 角色 | create/update/delete | 角色变更 |
| 角色 | permission_grant/permission_revoke | 权限变更 |
| 认证 | login/logout | 登录登出 |
| 认证 | mfa_enable/mfa_disable | MFA开关 |

---

## UM-9. API接口设计

### UM-9.1 用户管理

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/users` | POST | 创建用户 | user:create |
| `/api/v1/users` | GET | 获取用户列表 | user:read |
| `/api/v1/users/:id` | GET | 获取用户详情 | user:read |
| `/api/v1/users/:id` | PUT | 更新用户 | user:update |
| `/api/v1/users/:id` | DELETE | 删除用户 | user:delete |
| `/api/v1/users/:id/status` | PUT | 更新用户状态 | user:update |
| `/api/v1/users/:id/roles` | GET | 获取用户角色 | user:read |
| `/api/v1/users/:id/roles` | POST | 分配用户角色 | user:update |
| `/api/v1/users/:id/roles/:roleId` | DELETE | 移除用户角色 | user:update |
| `/api/v1/users/:id/permissions` | GET | 获取用户权限 | user:read |
| `/api/v1/users/import` | POST | 批量导入用户 | user:create |
| `/api/v1/users/export` | GET | 导出用户 | user:read |

### UM-9.2 认证接口

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/auth/login` | POST | 用户登录 | 公开 |
| `/api/v1/auth/logout` | POST | 用户登出 | 登录用户 |
| `/api/v1/auth/refresh` | POST | 刷新Token | 公开 |
| `/api/v1/auth/password` | PUT | 修改密码 | 登录用户 |
| `/api/v1/auth/forgot-password` | POST | 忘记密码 | 公开 |
| `/api/v1/auth/reset-password` | POST | 重置密码 | 公开 |
| `/api/v1/auth/me` | GET | 获取当前用户 | 登录用户 |
| `/api/v1/auth/mfa/setup` | POST | 开启MFA | 登录用户 |
| `/api/v1/auth/mfa/verify` | POST | 验证MFA | 登录用户 |
| `/api/v1/auth/mfa/disable` | POST | 关闭MFA | 登录用户 |

### UM-9.3 角色管理

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/roles` | POST | 创建角色 | role:create |
| `/api/v1/roles` | GET | 获取角色列表 | role:read |
| `/api/v1/roles/:id` | GET | 获取角色详情 | role:read |
| `/api/v1/roles/:id` | PUT | 更新角色 | role:update |
| `/api/v1/roles/:id` | DELETE | 删除角色 | role:delete |
| `/api/v1/roles/:id/permissions` | GET | 获取角色权限 | role:read |
| `/api/v1/roles/:id/permissions` | PUT | 更新角色权限 | role:update |

### UM-9.4 权限管理

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/permissions` | GET | 获取权限列表 | permission:read |
| `/api/v1/permissions/modules` | GET | 按模块获取权限 | permission:read |

### UM-9.5 部门管理

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/departments` | POST | 创建部门 | department:create |
| `/api/v1/departments` | GET | 获取部门列表 | department:read |
| `/api/v1/departments/:id` | GET | 获取部门详情 | department:read |
| `/api/v1/departments/:id` | PUT | 更新部门 | department:update |
| `/api/v1/departments/:id` | DELETE | 删除部门 | department:delete |
| `/api/v1/departments/:id/members` | GET | 获取部门成员 | department:read |

### UM-9.6 审计日志

| 接口 | 方法 | 功能描述 | 权限 |
|------|------|----------|------|
| `/api/v1/audit-logs/login` | GET | 登录日志 | audit:read |
| `/api/v1/audit-logs/operation` | GET | 操作日志 | audit:read |

---

## UM-10. 数据模型关系

```
User（用户）
    │
    ├── Department（部门）
    │       │
    │       └── User.departmentId → Department.id
    │
    ├── Role（角色）
    │       │
    │       └── UserRole（用户角色关联）
    │               │
    │               ├── UserRole.userId → User.id
    │               └── UserRole.roleId → Role.id
    │
    ├── Permission（权限）
    │       │
    │       └── RolePermission（角色权限关联）
    │               │
    │               ├── RolePermission.roleId → Role.id
    │               └── RolePermission.permissionId → Permission.id
    │
    ├── User（上级）
    │       │
    │       └── User.managerId → User.id
    │
    ├── LoginLog（登录日志）
    │       │
    │       └── LoginLog.userId → User.id
    │
    └── OperationLog（操作日志）
            │
            └── OperationLog.userId → User.id
```

---

## UM-11. 安全要求

### UM-11.1 密码安全

- 密码使用bcrypt加密，cost factor ≥ 12
- 密码不在日志中记录
- 密码不在API响应中返回
- 密码强度客户端实时校验

### UM-11.2 传输安全

- 全站HTTPS
- Token通过Authorization Header传递
- 敏感操作需要重新验证

### UM-11.3 存储安全

- 数据库敏感字段加密存储
- MFA密钥加密存储
- 日志脱敏处理

---

## UM-12. 依赖关系

### UM-12.1 被依赖

| 模块 | 依赖说明 |
|------|----------|
| 全部业务模块 | 用户身份、权限校验 |
| 项目管理 | 项目成员关联 |
| 需求管理 | 需求创建人、负责人 |
| 任务管理 | 任务负责人 |

### UM-12.2 依赖

| 模块 | 依赖说明 |
|------|----------|
| 无 | 基础模块，不依赖其他业务模块 |

---

## UM-13. 验收标准

### UM-13.1 用户管理

- [ ] 支持用户CRUD操作
- [ ] 支持批量导入用户（Excel格式）
- [ ] 支持导出用户列表
- [ ] 支持用户状态管理（激活/禁用/锁定）
- [ ] 支持用户头像上传

### UM-13.2 认证管理

- [ ] 支持用户名/邮箱登录
- [ ] 支持JWT Token认证
- [ ] 支持Refresh Token自动续期
- [ ] 支持密码修改
- [ ] 支持忘记密码流程
- [ ] 支持MFA（可选）

### UM-13.3 角色权限

- [ ] 支持预置角色
- [ ] 支持自定义角色
- [ ] 支持角色权限配置
- [ ] 支持用户角色分配
- [ ] 支持数据范围权限

### UM-13.4 审计日志

- [ ] 记录所有登录事件
- [ ] 记录敏感操作
- [ ] 支持日志查询
- [ ] 支持日志导出

---

**上一级**：[系统概述](system-overview.md)  
**下一级**：[核心模型](core-models.md)
