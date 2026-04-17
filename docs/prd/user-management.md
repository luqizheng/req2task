# 用户管理系统

## UM-1. 产品概述

### UM-1.1 产品定位

用户管理系统是 req2task 平台的基础支撑模块，负责平台用户的身份认证和权限控制，为所有业务功能提供身份基础。

### UM-1.2 目标用户

| 用户类型       | 使用场景             |
| ---------- | ---------------- |
| 管理员 (ADMIN) | 平台运维、用户管理      |
| 项目经理 (PROJECT_MANAGER) | 成员管理、项目配置     |
| 普通用户 (USER)  | 日常需求管理、任务协作    |

### UM-1.3 核心价值

- 统一身份认证：JWT Token + Refresh Token
- 简洁权限控制：基于角色的访问控制
- 首个用户自动成为系统管理员
- 安全审计：登录日志、操作记录

***

## UM-2. 功能范围

| 功能模块   | 功能点              | 优先级 |
| ------ | ---------------- | --- |
| 用户管理   | 用户CRUD、状态管理      | P0  |
| 认证管理   | 登录登出、密码管理、Token管理 | P0  |
| 审计日志   | 登录日志            | P1  |
| 个人信息   | 个人资料修改          | P2  |

***

## UM-3. 用户模型

### UM-3.1 用户实体

| 字段名            | 类型          | 必填 | 说明      | 业务规则                        |
| -------------- | ----------- | -- | ------- | --------------------------- |
| id             | UUID        | 是  | 用户唯一编号 | 系统自动生成                      |
| username       | string(50)  | 是  | 用户名     | 唯一，字母数字下划线，3-20位             |
| email          | string(255) | 是  | 邮箱      | 唯一，有效邮箱格式                   |
| displayName    | string(100) | 是  | 显示名称    | 用于界面展示                       |
| avatar         | string(500) | 否  | 头像URL   | 可选，默认gravatar               |
| passwordHash   | string(255) | 是  | 密码哈希    | bcrypt加密                     |
| role           | enum        | 是  | 用户角色    | ADMIN/USER/PROJECT_MANAGER   |
| loginFailCount | integer     | 是  | 连续失败次数  | 超过5次锁定账户                    |
| lockedUntil    | datetime    | 否  | 锁定截止时间  | 为空表示未锁定，超过此时间自动解锁         |
| lastLoginAt    | datetime    | 否  | 最后登录时间  | 自动更新                        |
| createdAt      | datetime    | 是  | 创建时间    | 系统自动生成                      |
| updatedAt      | datetime    | 是  | 更新时间    | 系统自动更新                      |

### UM-3.2 用户角色枚举

```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PROJECT_MANAGER = 'projectManager',
}
```

***

## UM-4. 认证管理

### UM-4.1 注册流程

```
1. 用户输入用户名、邮箱、密码
2. 系统校验：
   - 用户名唯一
   - 邮箱唯一
   - 密码符合策略
3. 创建用户：
   - 若系统无用户，当前用户角色为 ADMIN
   - 否则默认角色为 USER
4. 返回成功
```

### UM-4.2 登录流程

```
1. 用户输入用户名/邮箱 + 密码
2. 系统校验：
   - 账号是否存在
   - 账户是否被锁定（lockedUntil > 当前时间）
   - 密码是否正确
3. 登录成功：
   - 生成JWT Access Token（15分钟）
   - 生成 Refresh Token（7天）
   - 更新最后登录时间
   - 重置登录失败计数
4. 登录失败：
   - 增加登录失败计数
   - 超过5次则锁定账户30分钟
5. 返回Token给客户端
```

### UM-4.2 密码策略

| 策略项       | 默认值 | 可配置 |
| --------- | --- | --- |
| 最小长度      | 8位  | 否   |
| 最大长度      | 32位 | 否   |
| 必须包含大写字母  | 是   | 否   |
| 必须包含小写字母  | 是   | 否   |
| 必须包含数字    | 是   | 否   |
| 登录失败锁定次数  | 5次  | 否   |
| 锁定时长      | 30分钟 | 否   |

***

## UM-5. 会话管理

### UM-5.1 Access Token (JWT)

```json
{
  "sub": "user-uuid",
  "username": "john",
  "role": "admin",
  "exp": 1712345678,
  "iat": 1712344578,
  "iss": "req2task"
}
```

### UM-5.2 Refresh Token

- 存储于数据库
- 有效期7天
- 支持续期和主动失效

### UM-5.3 会话策略

| 配置项              | 默认值  | 说明      |
| ---------------- | ---- | ------- |
| Access Token有效期  | 15分钟 | 短期令牌    |
| Refresh Token有效期 | 7天   | 长期令牌    |
| 单用户最大会话数        | 3    | 超出踢出旧会话 |

***

## UM-6. 审计日志

### UM-6.1 登录日志

| 字段名        | 类型       | 说明    |
| ---------- | -------- | ----- |
| id         | UUID     | 主键    |
| userId     | UUID     | 用户ID   |
| username   | string   | 用户名   |
| eventType  | enum     | login/logout/failed_login |
| ip         | string   | IP地址  |
| userAgent  | string   | 浏览器UA |
| status     | enum     | success/failure |
| failureReason | string | 失败原因  |
| createdAt  | datetime | 发生时间  |

***

## UM-7. API接口设计

### UM-7.1 用户管理

| 接口                         | 方法     | 功能描述   | 权限        |
| -------------------------- | ------ | ------ | --------- |
| `/api/v1/users`            | POST   | 创建用户   | admin     |
| `/api/v1/users`            | GET    | 获取用户列表 | 登录用户     |
| `/api/v1/users/:id`        | GET    | 获取用户详情 | 登录用户     |
| `/api/v1/users/:id`        | PUT    | 更新用户   | admin/本人  |
| `/api/v1/users/:id`        | DELETE | 删除用户   | admin     |
| `/api/v1/users/:id/avatar` | POST   | 上传头像   | admin/本人  |

### UM-7.2 认证接口

| 接口                       | 方法   | 功能描述    | 权限   |
| ------------------------ | ---- | ------- | ---- |
| `/api/v1/auth/login`     | POST | 用户登录    | 公开   |
| `/api/v1/auth/logout`    | POST | 用户登出    | 登录用户 |
| `/api/v1/auth/refresh`   | POST | 刷新Token  | 公开   |
| `/api/v1/auth/me`        | GET  | 获取当前用户  | 登录用户 |
| `/api/v1/auth/password`  | PUT  | 修改密码    | 登录用户 |

### UM-7.3 审计日志

| 接口                       | 方法  | 功能描述  | 权限   |
| ------------------------ | --- | ----- | ---- |
| `/api/v1/audit-logs/login` | GET | 登录日志 | admin |

***

## UM-8. 数据模型关系

```
User（用户）
    │
    ├── LoginLog（登录日志）
    │       │
    │       └── LoginLog.userId → User.id
    │
    └── Project（项目）- 成员关联
```

***

## UM-9. 安全要求

### UM-9.1 密码安全

- 密码使用bcrypt加密
- 密码不在日志中记录
- 密码不在API响应中返回

### UM-9.2 传输安全

- 全站HTTPS
- Token通过Authorization Header传递

***

## UM-10. 依赖关系

### UM-10.1 被依赖

| 模块     | 依赖说明      |
| ------ | --------- |
| 全部业务模块 | 用户身份、权限校验 |
| 项目管理   | 项目成员关联    |
| 需求管理   | 需求创建人、负责人 |

### UM-10.2 依赖

| 模块 | 依赖说明           |
| -- | -------------- |
| 无  | 基础模块，不依赖其他业务模块 |

***

## UM-11. 验收标准

### UM-11.1 用户管理

- [ ] 支持用户CRUD操作
- [ ] 支持用户状态管理
- [ ] 支持头像上传

### UM-11.2 认证管理

- [ ] 支持用户名/邮箱登录
- [ ] 支持JWT Token认证
- [ ] 支持Refresh Token自动续期
- [ ] 支持密码修改
- [ ] 支持登录失败锁定（5次后锁定30分钟）
- [ ] 首个注册用户自动成为系统管理员

### UM-11.3 审计日志

- [ ] 记录所有登录事件
- [ ] 支持日志查询

***

**上一级**：[系统概述](system-overview.md)\
**下一级**：[核心模型](core-models.md)
