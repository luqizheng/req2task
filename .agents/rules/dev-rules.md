# 开发规则

## 输出规则

- 使用简体中文输出
- 禁止使用问候语、结束语、感谢语
- 禁止使用过渡词（首先、其次、然后、总之）
- 禁止重复已知信息
- 直接给出核心结论或必要步骤
- 简洁短句，不超过 20 字
- 不解释"为什么这么回答"
- 提问只问最关键的 1 个问题

## 控制台规则

- 采用 Windows PowerShell 输出
- 使用 UTF8 with BOM 编码格式

## 代码规则

- 不添加注释（除非用户明确要求）
- 遵循项目既有代码风格
- 优先使用现有库和工具
- 使用 `<script setup lang="ts">` 语法（Vue）
- 使用 Constructor Injection（NestJS）

## Service 规则

- Controller 方法必须显式声明返回类型
- Web 项目调用的 API 类型必须与 Service 保持一致（使用 `packages/dto` 中定义的类型）

## DTO 共享规则

Web 和 Service 之间交互的 Request/Response DTO 必须定义在 `packages/dto` 中：

- `packages/dto/src/user/` - 用户相关 DTO
- `packages/dto/src/common/` - 通用 DTO
- 文件命名：kebab-case（如 `create-user.dto.ts`）
- 类命名：PascalCase + Dto 后缀（如 `CreateUserDto`）
- Response DTO 添加 `Response` 后缀（如 `UserResponseDto`）

禁止：

- 在 web 或 service 中单独定义已存在于 dto 包的类型
- 直接在 controller 中返回数据库实体（应使用 DTO 转换）

## 命名规范

### TypeScript 文件

| 类型              | 规范             | 示例                      |
| ----------------- | ---------------- | ------------------------- |
| 类/接口/类型/枚举 | PascalCase       | `UserService`, `UserRole` |
| 变量/函数/方法    | camelCase        | `userName`, `findById()`  |
| 常量              | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`         |
| 文件名（TS/TSX）  | kebab-case       | `user-service.ts`         |
| 目录名            | kebab-case       | `user-management/`        |

### Vue 文件

| 类型         | 规范       | 示例                                    |
| ------------ | ---------- | --------------------------------------- |
| 组件（.vue） | PascalCase | `UserCard.vue`                          |
| 组件文件引用 | PascalCase | `import UserCard from './UserCard.vue'` |
| 组合式函数   | camelCase  | `useUserList.ts`                        |

### 数据库

| 类型 | 规范               | 示例                         |
| ---- | ------------------ | ---------------------------- |
| 表名 | snake_case（复数） | `user_roles`                 |
| 列名 | snake_case         | `created_at`, `display_name` |
| 主键 | `id`               | UUID 主键                    |
| 外键 | `{entity}_id`      | `user_id`                    |

### API 路由

| 类型      | 规范                 | 示例                               |
| --------- | -------------------- | ---------------------------------- |
| 路径      | kebab-case, 复数名词 | `/api/users`, `/api/user-profiles` |
| HTTP 方法 | 小写                 | `GET`, `POST`, `PUT`, `DELETE`     |

### 变量命名

- 布尔值：`is`, `has`, `can`, `should` 前缀
  - `isActive`, `hasPermission`, `canEdit`
- 数组：复数名词
  - `users`, `items`, `roles`
- 临时变量：`tmp`, `temp` 前缀
  - `tmpUser`, `tempFile`
