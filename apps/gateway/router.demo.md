# Gateway 路由配置指南

## Nacos 配置中心路由配置

### 路由配置文件

在 Nacos 控制台添加配置：

- **Data ID**: `gateway-routes`
- **Group**: `DEFAULT_GROUP`
- **配置格式**: JSON

### 完整配置示例

```json
{
  "routes": [
    {
      "id": "auth",
      "name": "认证服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/auth/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false
    },
    {
      "id": "users",
      "name": "用户服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/users/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false
    },
    {
      "id": "projects",
      "name": "项目服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/projects/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false
    },
    {
      "id": "requirements",
      "name": "需求服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/requirements/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false
    },
    {
      "id": "tasks",
      "name": "任务服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/tasks/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false
    },
    {
      "id": "ai",
      "name": "AI服务",
      "priority": 10,
      "serviceName": "service",
      "pathPattern": "/api/ai/*",
      "methods": ["ALL"],
      "targetService": "service",
      "targetPort": 4000,
      "isRegex": false,
      "pathRewrite": {
        "pattern": "^/api/ai",
        "replacement": ""
      }
    },
    {
      "id": "conversations",
      "name": "对话服务",
      "priority": 10,
      "serviceName": "ai-chat-service",
      "pathPattern": "/api/conversations/*",
      "methods": ["ALL"],
      "targetService": "ai-chat-service",
      "targetPort": 4001,
      "isRegex": false
    },
    {
      "id": "chat",
      "name": "聊天服务",
      "priority": 10,
      "serviceName": "ai-chat-service",
      "pathPattern": "/api/chat/*",
      "methods": ["ALL"],
      "targetService": "ai-chat-service",
      "targetPort": 4001,
      "isRegex": false
    },
    {
      "id": "convert",
      "name": "文件转换服务",
      "priority": 10,
      "serviceName": "file-conversion",
      "pathPattern": "/api/convert/*",
      "methods": ["ALL"],
      "targetService": "file-conversion",
      "targetPort": 4002,
      "isRegex": false
    },
    {
      "id": "health",
      "name": "健康检查",
      "priority": 100,
      "serviceName": "gateway",
      "pathPattern": "/api/health/*",
      "methods": ["ALL"],
      "targetService": "gateway",
      "targetPort": 3000,
      "isRegex": false
    }
  ]
}
```

## 字段说明

| 字段              | 类型        | 必填 | 说明                                                  |
| --------------- | --------- | -- | --------------------------------------------------- |
| `id`            | string    | 是  | 路由唯一标识                                              |
| `name`          | string    | 否  | 路由名称                                                |
| `priority`      | number    | 否  | 优先级，数值越大优先级越高                                       |
| `serviceName`   | string    | 是  | 目标服务名称（用于 Nacos 服务发现）                               |
| `pathPattern`   | string    | 是  | 路径匹配模式，支持 `*` 通配符                                   |
| `methods`       | string\[] | 否  | 支持的 HTTP 方法，默认 ALL                                  |
| `targetService` | string    | 是  | 目标服务标识                                              |
| `targetPort`    | number    | 是  | 目标服务端口                                              |
| `isRegex`       | boolean   | 否  | 是否使用正则匹配，默认 false                                   |
| `pathRewrite`   | object    | 否  | 路径重写规则，用于转发时修改请求路径                               |
| `timeout`       | number    | 否  | 请求超时时间(ms)，默认 30000                                 |
| `retryAttempts` | number    | 否  | 重试次数，默认 0                                           |
| `loadBalancer`  | string    | 否  | 负载均衡策略：roundRobin/weightedRandom/weightedRoundRobin |

### pathRewrite 字段说明

| 字段          | 类型     | 说明                    |
| ----------- | ------ | --------------------- |
| `pattern`   | string | 正则匹配模式（JavaScript 正则）  |
| `replacement` | string | 替换字符串，支持捕获组 `$1` 等 |

#### 使用示例

将 `/api/ai/xxx` 路径重写为 `/xxx`：

```json
{
  "pathRewrite": {
    "pattern": "^/api/ai",
    "replacement": ""
  }
}
```

将 `/api/v1/users/*` 重写为 `/api/users/*`：

```json
{
  "pathRewrite": {
    "pattern": "^/api/v1",
    "replacement": "/api"
  }
}
```

使用捕获组重写路径：

```json
{
  "pathRewrite": {
    "pattern": "^/api/([^/]+)/(.+)$",
    "replacement": "/$2"
  }
}
```

> 注意：`pattern` 为 JavaScript 正则表达式，请确保转义特殊字符。

## 其他 Nacos 配置

### 负载均衡配置

- **Data ID**: `gateway-loadbalancer`
- **Group**: `DEFAULT_GROUP`

```json
{
  "defaultStrategy": "roundRobin",
  "strategies": {
    "service": "weightedRoundRobin",
    "ai-chat-service": "weightedRandom",
    "file-conversion": "roundRobin"
  }
}
```

#### 字段说明

| 字段                | 类型     | 说明        |
| ----------------- | ------ | --------- |
| `defaultStrategy` | string | 默认负载均衡策略  |
| `strategies`      | object | 各服务独立策略映射 |

#### 支持的策略

| 策略                   | 说明     | 适用场景            |
| -------------------- | ------ | --------------- |
| `roundRobin`         | 加权轮询   | 权重均匀分布的标准场景     |
| `weightedRoundRobin` | 权重平滑轮询 | 权重差异较大的场景，分配更平滑 |
| `weightedRandom`     | 加权随机   | 权重差异较大，无需严格均匀分配 |

#### 算法原理

**weightedRandom（加权随机）**：

- 根据实例权重构建加权列表
- 权重为 2 的实例出现 2 次，权重为 3 的实例出现 3 次
- 随机选择，高权重实例被选中的概率更高

**weightedRoundRobin（权重平滑轮询）**：

- 每次选择当前权重最高的实例
- 选中后降低其当前权重
- 适合请求分布要求平滑的场景

#### 服务实例权重配置

在 Nacos 注册服务实例时，通过 `weight` 参数设置权重：

```json
{
  "serviceName": "service",
  "ip": "192.168.1.10",
  "port": 4000,
  "weight": 2
}
```

| 权重 | 相对流量比例 |
| -- | ------ |
| 1  | 25%    |
| 2  | 50%    |
| 3  | 75%    |

> 注：实际比例 = 实例权重 / 所有实例权重之和

### 熔断器配置

- **Data ID**: `gateway-circuitbreaker`

```json
{
  "failureThreshold": 5,
  "resetTimeout": 30000,
  "halfOpenRequests": 1
}
```

| 字段                 | 说明         | 默认值   |
| ------------------ | ---------- | ----- |
| `failureThreshold` | 失败次数阈值     | 5     |
| `resetTimeout`     | 重置超时时间(ms) | 30000 |
| `halfOpenRequests` | 半开状态允许请求数  | 1     |

## Nacos 环境变量

| 变量                | 默认值            | 说明          |
| ----------------- | -------------- | ----------- |
| `NACOS_HOST`      | localhost      | Nacos 服务器地址 |
| `NACOS_PORT`      | 8848           | Nacos 端口    |
| `NACOS_NAMESPACE` | -              | 命名空间 ID     |
| `NACOS_GROUP`     | DEFAULT\_GROUP | 配置分组        |
| `NACOS_CLUSTER`   | DEFAULT        | 集群名称        |
| `NACOS_TIMEOUT`   | 3000           | 连接超时(ms)    |

## 服务注册

Gateway 启动时会自动注册到 Nacos：

- **服务名**: `api-gateway`
- **元数据**: 包含版本号和节点 PID

Gateway 使用本地 fallback 配置，当 Nacos 不可用时自动降级：

| 服务名               | Fallback 地址    |
| ----------------- | -------------- |
| `service`         | localhost:4000 |
| `ai-chat-service` | localhost:4001 |
| `file-conversion` | localhost:4002 |
| `rustfs`          | rustfs:900     |

## 独立服务手动注册

某些服务（如 RustFS）不原生支持 Nacos，需要手动注册到 Nacos。

### RustFS 对象存储服务

RustFS 是基于 MinIO 的对象存储服务，不会自动注册到 Nacos。

#### 在 Nacos 控制台手动注册

1. 进入 Nacos 控制台 → 服务管理 → 服务列表
2. 点击「注册实例」
3. 填写以下信息：

| 字段 | 值 |
|------|-----|
| 服务名 | `rustfs` |
| 分组 | `DEFAULT_GROUP` |
| IP | `rustfs`（Docker 网络中）或实际服务器 IP |
| 端口 | `9000` |
| 集群 | `DEFAULT` |
| 权重 | 1 |
| 临时实例 | 否 |

4. 点击「提交」

#### 添加 RustFS 路由配置

在 Nacos 中添加或更新 `gateway-routes` 配置：

```json
{
  "routes": [
    {
      "id": "rustfs-upload",
      "name": "RustFS 上传",
      "priority": 10,
      "serviceName": "rustfs",
      "pathPattern": "/api/storage/upload/*",
      "methods": ["POST"],
      "targetService": "rustfs",
      "targetPort": 9000,
      "isRegex": false
    },
    {
      "id": "rustfs-download",
      "name": "RustFS 下载",
      "priority": 10,
      "serviceName": "rustfs",
      "pathPattern": "/api/storage/download/*",
      "methods": ["GET"],
      "targetService": "rustfs",
      "targetPort": 9000,
      "isRegex": false
    },
    {
      "id": "rustfs-presigned",
      "name": "RustFS 预签名URL",
      "priority": 10,
      "serviceName": "rustfs",
      "pathPattern": "/api/storage/presigned/*",
      "methods": ["GET"],
      "targetService": "rustfs",
      "targetPort": 9000,
      "isRegex": false
    }
  ]
}
```

#### Docker Compose 示例

```yaml
services:
  rustfs:
    image: minio/minio:latest
    container_name: rustfs
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data
    networks:
      - req2task-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

networks:
  req2task-network:
    external: true
```

#### 验证注册状态

```bash
# 检查服务是否注册成功
curl "http://localhost:8848/nacos/v1/ns/instance/list?serviceName=rustfs&groupName=DEFAULT_GROUP"
```

成功响应示例：

```json
{
  "dom": "rustfs",
  "cacheMillis": 1000,
  "useSpecifiedURL": false,
  "hosts": [
    {
      "instanceId": "rustfs-1",
      "ip": "rustfs",
      "port": 9000,
      "serviceName": "rustfs",
      "healthy": true,
      "weight": 1
    }
  ],
  "metadata": {}
}
```

