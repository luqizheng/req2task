# 任务列表

## 任务 1：安装认证相关依赖

- [x] 1.1 在 apps/service/package.json 添加 @nestjs/jwt、@nestjs/passport、passport、passport-jwt、bcrypt
- [x] 1.2 运行 pnpm install 安装依赖
- [x] 1.3 添加类型定义包 @types/passport-jwt、@types/bcrypt

## 任务 2：扩展 User 实体（packages/core）

- [x] 2.1 创建 UserRole 枚举（admin/user/projectManager）
- [x] 2.2 扩展 User 类添加 displayName、role、passwordHash 字段
- [x] 2.3 更新 packages/core/src/index.ts 导出新类型
- [x] 2.4 验证 core 包编译通过

## 任务 3：创建 Auth 模块（apps/service/src/auth）

- [x] 3.1 创建 auth.module.ts
- [x] 3.2 创建 auth.controller.ts（/auth/register、/auth/login）
- [x] 3.3 创建 auth.service.ts（实现注册和登录逻辑）
- [x] 3.4 创建 jwt.strategy.ts（Passport JWT 策略）
- [x] 3.5 创建 DTO：register.dto.ts、login.dto.ts
- [x] 3.6 创建登录响应 DTO：login-response.dto.ts

## 任务 4：创建 Users 模块（apps/service/src/users）

- [x] 4.1 创建 users.module.ts
- [x] 4.2 创建 users.controller.ts
- [x] 4.3 创建 users.service.ts（实现用户 CRUD）
- [x] 4.4 创建 DTO：
  - create-user.dto.ts
  - update-user.dto.ts
  - update-me.dto.ts
  - change-password.dto.ts
  - user-response.dto.ts
  - user-list-response.dto.ts

## 任务 5：创建 Guards 和 Decorators

- [x] 5.1 创建 JwtAuthGuard（@nestjs/passport）
- [x] 5.2 创建 RolesGuard（检查角色权限）
- [x] 5.3 创建 @Roles() 装饰器
- [x] 5.4 创建 @CurrentUser() 装饰器（获取当前用户）

## 任务 6：实现 Users Service

- [x] 6.1 实现 findAll（分页查询）
- [x] 6.2 实现 findById
- [x] 6.3 实现 findByUsername
- [x] 6.4 实现 create（bcrypt 密码哈希）
- [x] 6.5 实现 update
- [x] 6.6 实现 delete
- [x] 6.7 实现 updatePassword（修改密码）
- [x] 6.8 实现 updateProfile（更新个人信息）

## 任务 7：配置 App Module

- [x] 7.1 在 AppModule 导入 AuthModule
- [x] 7.2 在 AppModule 导入 UsersModule
- [x] 7.3 配置 JWT 模块（全局守卫或 imports）
- [x] 7.4 更新 TypeORM 配置确保 User 实体正确加载

## 任务 8：添加环境变量配置

- [x] 8.1 在 apps/service/.env.example 添加 JWT_SECRET、JWT_EXPIRES_IN
- [x] 8.2 在 main.ts 读取环境变量

## 任务 9：单元测试

- [x] 9.1 编写 AuthService 单元测试
- [x] 9.2 编写 UsersService 单元测试
- [x] 9.3 验证所有测试通过

## 任务 10：验证功能

- [x] 10.1 验证 service 可以正常启动
- [x] 10.2 验证 API 端点响应正常
- [x] 10.3 运行 pnpm lint 检查代码风格
- [x] 10.4 验证构建成功

## 任务依赖

- 任务 1 完成后才能开始任务 3、4
- 任务 2 完成后才能开始任务 3、4、6
- 任务 3、4 完成后才能开始任务 5
- 任务 5、6 完成后才能开始任务 7
- 任务 7 完成后才能开始任务 10
- 任务 10 完成后才能开始任务 9
