# 系统设置模块

## SS-1. 产品概述

### SS-1.1 产品定位

系统设置模块是 req2task 平台的全局配置中心，提供系统级别的功能开关和安全策略配置。

### SS-1.2 目标用户

| 用户类型       | 使用场景             |
| ---------- | ---------------- |
| 管理员 (ADMIN) | 系统全局配置、开关管理 |

### SS-1.3 核心价值

- 统一管理平台全局配置
- 控制用户注册行为
- 配置安全策略参数
- 为未来功能预留扩展性

***

## SS-2. 功能范围

| 功能模块      | 功能点                | 优先级 |
| --------- | ------------------- | --- |
| 注册控制     | 开关用户注册功能          | P0  |
| 安全策略     | 登录锁定时长配置          | P0  |
| 测试数据管理  | 导入测试数据开关（预留）      | P2  |

***

## SS-3. 配置项定义

### SS-3.1 系统配置实体

| 字段名          | 类型          | 必填 | 说明         | 业务规则                        |
| ------------ | ----------- | -- | ---------- | --------------------------- |
| id           | UUID        | 是  | 配置项唯一编号 | 系统自动生成                      |
| configKey    | string(100) | 是  | 配置项键     | 唯一，驼峰命名                     |
| configValue  | string(500) | 是  | 配置项值     | 根据类型不同含义                   |
| configType   | enum        | 是  | 配置类型     | boolean/number/string         |
| description  | string(200) | 否  | 配置描述     | 用于管理员理解配置含义               |
| defaultValue | string(100) | 是  | 默认值       | 系统内置默认值                    |
| isSystem     | boolean     | 是  | 是否系统内置   | true表示不可删除                  |
| createdAt    | datetime    | 是  | 创建时间     | 系统自动生成                      |
| updatedAt    | datetime    | 是  | 更新时间     | 系统自动更新                      |

### SS-3.2 配置项列表

| 配置键                     | 配置类型 | 默认值   | 说明                    |
| ---------------------- | ---- | ----- | --------------------- |
| registration.enabled   | boolean | true  | 是否启用用户注册功能           |
| security.lockDuration  | number  | 30    | 登录失败锁定时长（分钟）         |
| testData.importEnabled | boolean | false | 是否允许导入测试数据（预留）      |

***

## SS-4. 业务规则

### SS-4.1 注册开关

```
配置项：registration.enabled
类型：boolean
默认值：true

规则：
1. 当值为 true 时：
   - 用户可以正常注册账号
   - 首个注册用户自动成为系统管理员
2. 当值为 false 时：
   - 注册接口返回错误"系统已关闭注册"
   - 仅限管理员手动创建用户
```

### SS-4.2 登录锁定时长

```
配置项：security.lockDuration
类型：number
单位：分钟
默认值：30

规则：
1. 用户登录连续失败达到阈值（5次）后，账户被锁定
2. 锁定时长以此配置为准
3. 锁定到期后自动解锁
4. 锁定期间任何登录尝试均失败
```

> **锁定机制说明**：详见 [用户管理](user-management.md) UM-4.2 登录流程

### SS-4.3 测试数据开关

```
配置项：testData.importEnabled
类型：boolean
默认值：false

规则：
1. 当前为预留配置，暂不实现
2. 后续可用于导入示例项目、示例需求等测试数据
```

***

## SS-5. API接口设计

### SS-5.1 配置管理接口

| 接口                         | 方法     | 功能描述   | 权限    |
| -------------------------- | ------ | ------ | ----- |
| `/api/v1/system-configs`   | GET    | 获取所有配置 | admin |
| `/api/v1/system-configs`   | PUT    | 批量更新配置 | admin |
| `/api/v1/system-configs/:key` | GET  | 获取单个配置 | admin |
| `/api/v1/system-configs/:key` | PUT  | 更新单个配置 | admin |

### SS-5.2 Request/Response

#### 获取所有配置

**Request**
```http
GET /api/v1/system-configs
Authorization: Bearer {token}
```

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "registration": {
      "enabled": true
    },
    "security": {
      "lockDuration": 30
    },
    "testData": {
      "importEnabled": false
    }
  }
}
```

#### 更新配置

**Request**
```http
PUT /api/v1/system-configs/registration.enabled
Authorization: Bearer {token}
Content-Type: application/json

{
  "configValue": false
}
```

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "configKey": "registration.enabled",
    "configValue": false,
    "updatedAt": "2026-04-17T10:00:00Z"
  }
}
```

***

## SS-6. 数据模型关系

```
SystemConfig（系统配置）
    │
    └── 按 configKey 维度组织配置
```

***

## SS-7. 依赖关系

### SS-7.1 被依赖

| 模块       | 依赖说明              |
| -------- | ----------------- |
| 用户管理    | 读取注册开关、锁定时长配置  |
| 认证模块    | 登录时校验锁定时长       |

### SS-7.2 依赖

| 模块 | 依赖说明         |
| -- | -------------- |
| 无  | 基础模块，不依赖其他业务模块 |

***

## SS-8. 验收标准

### SS-8.1 配置管理

- [ ] 支持管理员查看所有系统配置
- [ ] 支持管理员修改配置项
- [ ] 配置修改后实时生效

### SS-8.2 注册控制

- [ ] 注册开关关闭后，新用户无法注册
- [ ] 注册开关关闭后，管理员可手动创建用户

### SS-8.3 安全策略

- [ ] 锁定时长配置生效（需配合用户管理模块）
- [ ] 锁定时长可动态修改

***

## SS-9. 扩展性设计

### SS-9.1 未来配置项

| 配置键               | 配置类型  | 预留说明      |
| ------------------ | ----- | --------- |
| security.maxLoginAttempts | number | 登录失败锁定次数 |
| session.maxSessions | number | 单用户最大会话数 |
| session.accessTokenExpiry | number | Access Token有效期（分钟） |
| session.refreshTokenExpiry | number | Refresh Token有效期（天） |
| password.minLength | number | 密码最小长度 |
| password.requireUppercase | boolean | 必须包含大写字母 |
| password.requireLowercase | boolean | 必须包含小写字母 |
| password.requireNumber | boolean | 必须包含数字 |

### SS-9.2 配置分组

```
system-configs
├── security
│   ├── lockDuration
│   ├── maxLoginAttempts
│   └── passwordPolicy.*
├── registration
│   └── enabled
├── session
│   ├── maxSessions
│   ├── accessTokenExpiry
│   └── refreshTokenExpiry
└── testData
    └── importEnabled
```

***

**上一级**：[系统概述](system-overview.md)\
**下一级**：[用户管理](user-management.md)
