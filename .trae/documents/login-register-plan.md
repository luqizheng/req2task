# 登录注册功能实现计划

## 1. 创建认证相关 DTO

在 `packages/dto/src/auth/` 创建：

- `login.dto.ts` - 登录请求
- `register.dto.ts` - 注册请求
- `login-response.dto.ts` - 登录响应

## 2. 创建前端 API 层

在 `apps/web/src/api/` 创建：

- `axios.ts` - Axios 封装（拦截器、baseURL）
- `auth.ts` - 认证 API（login, register, logout）

## 3. 创建用户状态管理

在 `apps/web/src/stores/` 创建：

- `user.ts` - Pinia store（存储用户信息、token）

## 4. 修改登录页面

修改 `apps/web/src/views/LoginView.vue`：

- 调用真实 API
- 登录成功后存储 token 和用户信息
- 错误提示

## 5. 修改注册页面

修改 `apps/web/src/views/RegisterView.vue`：

- 调用真实 API
- 成功跳转登录页

## 6. 添加路由守卫

修改 `apps/web/src/router/index.ts`：

- 添加 beforeEach 守卫
- 检查 token 有效性
- 未登录跳转到登录页
- 登录页和注册页允许访问

## 7. 创建环境配置

创建 `apps/web/.env.development` 和 `.env.production`