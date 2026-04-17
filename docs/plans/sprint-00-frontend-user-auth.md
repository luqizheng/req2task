# Sprint 0: 用户与认证管理

**计划类型**: 前端开发计划
**目标**: 用户管理 CRUD、个人中心、认证模块完善
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M0 (前置依赖)

---

## 1. 目标

- 用户管理 CRUD（对接后端 API）
- 个人中心页面
- 认证模块完善
- 角色权限管理界面

---

## 2. 当前状态

### 2.1 已完成

| 类别 | 状态 | 说明 |
|------|------|------|
| 用户列表页面 | ⚠️ 待对接 | 静态页面，需对接 API |
| 登录/注册页面 | ✅ 完成 | 已对接后端 |
| Token 管理 | ✅ 完成 | Store 已实现 |

### 2.2 待开发

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户 API 层 | ❌ 待开发 | api/users.ts |
| 用户 Store | ❌ 待开发 | stores/user.ts |
| 用户 CRUD | ❌ 待开发 | 对接后端 API |
| 个人中心 | ❌ 待开发 | Profile 页面 |
| 修改密码 | ❌ 待开发 | 密码修改功能 |

---

## 3. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| API: users.ts | 4h | P0 | ⏳ |
| Store: user.ts 完善 | 6h | P0 | ⏳ |
| UserManageView.vue 对接 API | 8h | P0 | ⏳ |
| 个人中心页面 ProfileView.vue | 8h | P0 | ⏳ |
| 修改密码功能 | 4h | P0 | ⏳ |
| 角色权限界面 | 6h | P1 | ⏳ |

**总预估工时**: 36h

---

## 4. 交付物

- api/users.ts - 用户 API 调用层
- stores/user.ts - 用户状态管理
- UserManageView.vue - 对接 API 的用户管理页面
- ProfileView.vue - 个人中心页面
- 修改密码组件

---

## 5. 验收标准

- [ ] 可查看用户列表
- [ ] 可创建/编辑/删除用户
- [ ] 可修改个人资料
- [ ] 可修改密码
- [ ] 角色权限界面正常

---

## 6. 页面结构

### 6.1 UserManageView.vue (现有页面改造)

```
用户管理页面
├── 搜索/筛选栏
│   ├── 关键词搜索
│   ├── 角色筛选
│   └── 状态筛选
├── 用户列表
│   ├── ID
│   ├── 用户名
│   ├── 姓名
│   ├── 邮箱
│   ├── 角色
│   ├── 状态
│   ├── 创建时间
│   └── 操作
├── 分页组件
└── 添加/编辑对话框
```

### 6.2 ProfileView.vue (新页面)

```
个人中心页面
├── 基本信息区
│   ├── 用户名
│   ├── 姓名
│   ├── 邮箱
│   ├── 角色
│   └── 创建时间
├── 编辑资料表单
│   ├── 姓名
│   ├── 邮箱
│   └── 保存按钮
└── 安全设置区
    ├── 修改密码表单
    │   ├── 旧密码
    │   ├── 新密码
    │   └── 确认密码
    └── 修改按钮
```

---

## 7. 组件清单

| 组件 | 说明 |
|------|------|
| UserTable | 用户列表表格组件 |
| UserForm | 用户表单组件 |
| UserRoleTag | 角色标签组件 |
| PasswordForm | 修改密码表单组件 |
| ProfileCard | 个人资料卡片组件 |

---

## 8. 路由配置

```typescript
{
  path: '/users',
  name: 'UserManageView',
  component: UserManageView,
  meta: {
    requiresAuth: true,
    permission: 'user:view'
  }
},
{
  path: '/profile',
  name: 'ProfileView',
  component: ProfileView,
  meta: {
    requiresAuth: true
  }
}
```

---

## 9. API 设计

### 9.1 users.ts

```typescript
// API 调用层
GET    /users                         // 用户列表 (分页)
GET    /users/me                      // 当前用户信息
GET    /users/:id                     // 用户详情
POST   /users                         // 创建用户
PUT    /users/:id                     // 更新用户
DELETE /users/:id                     // 删除用户
PUT    /users/me                      // 更新个人资料
PUT    /users/me/password             // 修改密码
```

---

## 10. Store 设计

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<User | null>(null)
  const userList = ref<User[]>([])
  const loading = ref(false)
  const total = ref(0)

  // Actions
  const fetchCurrentUser = async () => { ... }
  const fetchUserList = async (params: UserListParams) => { ... }
  const createUser = async (data: CreateUserDto) => { ... }
  const updateUser = async (id: string, data: UpdateUserDto) => { ... }
  const deleteUser = async (id: string) => { ... }
  const updateProfile = async (data: UpdateMeDto) => { ... }
  const changePassword = async (data: ChangePasswordDto) => { ... }

  return {
    currentUser,
    userList,
    loading,
    total,
    fetchCurrentUser,
    fetchUserList,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
  }
})
```

---

## 11. 依赖关系

- **前置条件**: 无
- **后续 Sprint**: Sprint 1 项目与模块管理需要用户基础

---

## 12. 完成标准

- [ ] 用户 API 层正常工作
- [ ] 用户管理页面 CRUD 功能完整
- [ ] 个人中心页面功能正常
- [ ] 修改密码功能正常
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: 无
**下一 Sprint**: [Sprint 1: 项目与模块管理](sprint-01-frontend-projects-modules.md)
