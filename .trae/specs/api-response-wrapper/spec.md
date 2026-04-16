# 前后端通信规范 Spec

## Why
当前后端直接返回业务数据，前端需要自行处理各种响应格式，缺乏统一的响应结构。需建立统一API响应包装规范，提高前后端交互的一致性和可维护性。

## What Changes
- 在 packages/dto 中定义新的 ApiResponse 包装类
- 后端 NestJS 应用全局使用响应拦截器包装返回值
- 前端 axios 统一处理响应格式

## Impact
- Affected specs: 用户认证服务、用户管理服务等所有后端接口
- Affected code:
  - packages/dto/src/common/api-response.dto.ts
  - apps/service/src/main.ts
  - apps/web/src/api/axios.ts

## ADDED Requirements
### Requirement: 统一 API 响应包装
后端所有接口响应必须通过包装类返回，格式如下：

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "time": "2024-01-01T00:00:00.000Z",
  "url": "/api/users",
  "method": "GET",
  "body": {}
}
```

#### Scenario: 成功响应
- **WHEN** 后端处理请求成功
- **THEN** 返回 success=true, message=操作成功信息, data=业务数据, time=ISO8601时间, url=请求URL, method=请求方法

#### Scenario: 失败响应
- **WHEN** 后端处理请求发生异常
- **THEN** 返回 success=false, message=错误信息, time=ISO8601时间, url=请求URL, method=请求方法, body=请求参数(可选)

### Requirement: 前端响应处理
前端 axios 拦截器统一解析响应，提取 data 字段返回给调用方。

#### Scenario: 正常响应
- **WHEN** 响应 success=true
- **THEN** axios 返回 response.data.data 作为结果

#### Scenario: 异常响应
- **WHEN** 响应 success=false 或 HTTP 状态码非 2xx
- **THEN** 抛出错误，包含 message 信息

## MODIFIED Requirements
### Requirement: ApiResponseDto
**原内容**:
```typescript
export interface ApiResponseDto<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
```

**新内容**:
```typescript
export interface ApiResponseDto<T = unknown> {
  success: boolean
  message: string
  data?: T
  time: string
  url: string
  method?: string
  body?: Record<string, unknown>
}
```