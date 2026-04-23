# 用户管理系统

## UM-1. 产品概述

用户管理系统是 req2task 平台的基础支撑模块，为所有业务功能提供身份基础。

---

## UM-2. 用户实体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | UUID | 是 | 用户唯一编号 |
| username | string | 是 | 用户名（唯一） |
| email | string | 是 | 邮箱（唯一） |
| passwordHash | string | 是 | 密码哈希 |
| systemRole | enum | 是 | 系统角色 |
| createdAt | datetime | 是 | 创建时间 |
| updatedAt | datetime | 是 | 更新时间 |

---

## UM-3. 系统角色

### UM-3.1 角色定义

| 角色编码 | 名称 | 权限范围 |
|----------|------|----------|
| ADMIN | 系统管理员 | 所有系统操作、用户管理 |
| PROJECT_MANAGER | 项目经理 | 创建项目、访问参与的项目 |
| USER | 普通用户 | 访问参与的项目 |

### UM-3.2 角色分配规则

- 每个用户只能拥有一个系统角色
- 只有 ADMIN 可分配系统角色
- PROJECT_MANAGER 和 ADMIN 可创建项目

---

## UM-4. 认证管理

### UM-4.1 登录流程

```
1. 用户输入用户名/邮箱 + 密码
2. 系统校验账号状态和密码
3. 登录成功：生成 JWT Token
4. 返回 Token 给客户端
```

### UM-4.2 Token 结构

```json
{
  "sub": "user-uuid",
  "username": "john",
  "systemRole": "ADMIN",
  "exp": 1712345678,
  "iat": 1712344578
}
```

---

## UM-5. API 接口

### UM-5.1 用户管理

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/users` | POST | 创建用户 |
| `/users` | GET | 获取用户列表 |
| `/users/:id` | GET | 获取用户详情 |
| `/users/:id` | PUT | 更新用户 |
| `/users/:id` | DELETE | 删除用户 |
| `/users/:id/system-role` | GET | 获取系统角色 |
| `/users/:id/system-role` | PUT | 分配系统角色 |

### UM-5.2 认证接口

| 接口 | 方法 | 功能描述 |
|------|------|----------|
| `/auth/login` | POST | 用户登录 |
| `/auth/logout` | POST | 用户登出 |
| `/auth/me` | GET | 获取当前用户 |

---

## UM-6. 依赖关系

| 模块 | 依赖说明 |
|------|----------|
| 项目成员系统 | 系统角色、项目成员关联 |
| 需求管理 | 需求创建人、负责人 |
| 任务管理 | 任务负责人 |

---

**上一级**：[系统概述](system-overview.md)  
**下一级**：[项目成员系统](project-user-system.md)
