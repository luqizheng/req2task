# 用户认证与管理服务规范

## Why

req2task 需要完整的用户认证和管理系统，支持基于角色的访问控制（RBAC），确保系统安全性和用户数据管理。

## What Changes

- 扩展 User 实体：添加 displayName、role、passwordHash 字段
- 实现 JWT 登录认证
- 实现用户 CRUD 管理（仅 admin）
- 实现个人管理功能（修改密码、查看个人信息）
- 在 service 项目中创建 auth 模块和 users 模块

## Impact

- **受影响的包**: `@req2task/core`、`@req2task/service`
- **新增文件**:
  - `apps/service/src/auth/` - 认证模块
  - `apps/service/src/users/` - 用户管理模块
  - `apps/service/src/common/guards/` - 认证守卫
  - `apps/service/src/common/decorators/` - 自定义装饰器
- **依赖变化**:
  - `@nestjs/jwt` - JWT 支持
  - `@nestjs/passport` - Passport 集成
  - `bcrypt` - 密码加密

## ADDED Requirements

### Requirement: User 实体扩展

User 实体 SHALL 包含以下字段：

| 字段 | 类型 | 描述 |
|------|------|------|
| id | UUID | 主键 |
| username | string | 登录名称（唯一） |
| email | string | 邮箱（唯一） |
| displayName | string | 显示名称 |
| role | enum | 角色：admin/user/projectManager |
| passwordHash | string | 密码哈希 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |

#### Scenario: User 角色枚举
- **WHEN** 创建用户时指定角色
- **THEN** 角色必须为 admin/user/projectManager 之一

### Requirement: 用户注册

系统 SHALL 提供用户注册功能：

#### Scenario: 成功注册
- **WHEN** 用户提交有效的注册信息（username, email, displayName, password）
- **THEN** 创建用户记录并返回用户信息（不含密码）
- **AND** 初始角色为 user

#### Scenario: 用户名重复
- **WHEN** 注册时用户名已存在
- **THEN** 返回 409 Conflict 错误

#### Scenario: 邮箱重复
- **WHEN** 注册时邮箱已存在
- **THEN** 返回 409 Conflict 错误

### Requirement: 用户登录

系统 SHALL 提供 JWT 登录认证：

#### Scenario: 成功登录
- **WHEN** 用户提交正确的 username 和 password
- **THEN** 返回 JWT token
- **AND** token 包含用户 ID 和角色

#### Scenario: 登录失败
- **WHEN** 用户提交错误的密码
- **THEN** 返回 401 Unauthorized 错误

#### Scenario: 用户不存在
- **WHEN** 登录时用户名不存在
- **THEN** 返回 401 Unauthorized 错误

### Requirement: JWT Token 结构

JWT Token SHALL 包含以下 payload：

```typescript
interface JwtPayload {
  sub: string;      // 用户 ID
  username: string; // 登录名称
  role: UserRole;  // 用户角色
  iat: number;      // 签发时间
  exp: number;      // 过期时间
}
```

Token 过期时间：7 天

### Requirement: 用户管理（Admin）

系统 SHALL 提供用户 CRUD 管理（仅 admin 可访问）：

#### Scenario: 获取用户列表
- **WHEN** admin 请求 GET /users
- **THEN** 返回分页的用户列表（不含密码）

#### Scenario: 获取单个用户
- **WHEN** admin 请求 GET /users/:id
- **THEN** 返回指定用户信息（不含密码）

#### Scenario: 创建用户（Admin）
- **WHEN** admin 创建新用户并指定角色
- **THEN** 创建成功并返回用户信息

#### Scenario: 更新用户
- **WHEN** admin 更新用户信息
- **THEN** 更新成功并返回新信息

#### Scenario: 删除用户
- **WHEN** admin 删除用户
- **THEN** 用户被标记为删除或物理删除

### Requirement: 个人管理

登录用户 SHALL 只能管理自己的信息：

#### Scenario: 查看我的信息
- **WHEN** 登录用户请求 GET /users/me
- **THEN** 返回当前用户的完整信息（不含密码）

#### Scenario: 修改我的密码
- **WHEN** 登录用户提交新密码
- **THEN** 更新密码并返回成功
- **AND** 原密码无需验证

#### Scenario: 修改我的信息
- **WHEN** 登录用户修改自己的 displayName 或 email
- **THEN** 更新成功并返回新信息
- **AND** 不能修改自己的角色

### Requirement: 角色权限

系统 SHALL 实现基于角色的访问控制：

| 端点 | admin | user | projectManager |
|------|-------|------|----------------|
| POST /auth/login | ✓ | ✓ | ✓ |
| POST /auth/register | ✓ | ✓ | ✓ |
| GET /users | ✓ | ✗ | ✗ |
| GET /users/:id | ✓ | ✗ | ✗ |
| POST /users | ✓ | ✗ | ✗ |
| PUT /users/:id | ✓ | ✗ | ✗ |
| DELETE /users/:id | ✓ | ✗ | ✗ |
| GET /users/me | ✓ | ✓ | ✓ |
| PUT /users/me/password | ✓ | ✓ | ✓ |
| PUT /users/me | ✓ | ✓ | ✓ |

### Requirement: 密码安全

系统 SHALL 使用 bcrypt 加密密码：

- 密码哈希使用 bcrypt，salt rounds = 10
- 登录时验证密码使用 bcrypt.compare
- API 响应绝不返回密码字段

## API Endpoints

### 认证端点

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |

### 用户端点

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /users | 获取用户列表 | admin |
| GET | /users/:id | 获取用户详情 | admin |
| POST | /users | 创建用户 | admin |
| PUT | /users/:id | 更新用户 | admin |
| DELETE | /users/:id | 删除用户 | admin |
| GET | /users/me | 获取当前用户 | JWT |
| PUT | /users/me/password | 修改密码 | JWT |
| PUT | /users/me | 修改个人信息 | JWT |

## 技术约束

- 使用 JWT 进行身份验证
- 密码必须使用 bcrypt 哈希存储
- 响应 DTO 不包含敏感字段（passwordHash）
- 使用 NestJS Guards 实现权限控制
- 使用 class-validator 进行输入验证
- 使用 TypeORM 进行数据库操作
- UUID 作为用户 ID
