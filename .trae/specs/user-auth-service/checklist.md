# 验证清单

## 依赖安装
- [x] apps/service/package.json 包含所有必需依赖（@nestjs/jwt、passport、bcrypt 等）
- [x] pnpm install 成功执行
- [x] 类型定义包已安装（@types/passport-jwt、@types/bcrypt）

## User 实体
- [x] UserRole 枚举正确定义（admin/user/projectManager）
- [x] User 类包含所有必需字段（id、username、email、displayName、role、passwordHash、createdAt、updatedAt）
- [x] User 类使用 UUID 主键
- [x] core 包编译成功

## Auth 模块
- [x] POST /auth/register 端点正常工作
- [x] POST /auth/login 端点返回 JWT token
- [x] 密码正确哈希存储（bcrypt）
- [x] 登录失败返回 401
- [x] 用户名/邮箱重复返回 409

## JWT 认证
- [x] JWT Token 包含正确的 payload（sub、username、role）
- [x] Token 过期时间为 7 天
- [x] JwtStrategy 正确验证 token
- [x] 受保护端点需要有效 token

## Users 模块
- [x] GET /users 仅 admin 可访问
- [x] GET /users/:id 返回用户信息（不含密码）
- [x] POST /users 仅 admin 可创建用户
- [x] PUT /users/:id 仅 admin 可更新用户
- [x] DELETE /users/:id 仅 admin 可删除用户

## 个人管理
- [x] GET /users/me 返回当前用户信息
- [x] PUT /users/me/password 修改当前用户密码
- [x] PUT /users/me 修改当前用户信息（displayName、email）
- [x] 普通用户不能修改自己的角色

## 权限控制
- [x] RolesGuard 正确检查用户角色
- [x] @Roles() 装饰器正常工作
- [x] @CurrentUser() 装饰器正确获取当前用户
- [x] JwtAuthGuard 保护需要认证的端点

## 代码质量
- [x] 所有 DTO 使用 class-validator 验证
- [x] 响应 DTO 不包含 passwordHash
- [x] 密码绝不以明文形式存储或返回
- [x] 错误处理使用 NestJS HTTP 异常
- [x] 代码符合 ESLint 规则（pnpm lint 通过）

## 测试
- [x] AuthService 单元测试覆盖注册和登录
- [x] UsersService 单元测试覆盖 CRUD
- [x] 所有测试通过（pnpm test）

## 构建
- [x] pnpm build 成功
- [x] service 可以正常启动
- [x] API 端点响应正常
