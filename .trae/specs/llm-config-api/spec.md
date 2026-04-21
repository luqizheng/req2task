# LLM 配置管理 API 规范

## Why

当前 ai-chat-service 中 LLM 配置仅支持环境变量方式管理，无法动态配置、切换不同 LLM 提供商，也无法持久化用户自定义配置。同时 llm-config 实体需要从 packages/core 迁移到 ai-chat-service。

## What Changes

- **BREAKING**: 从 packages/core 移除 llm-config.entity.ts
- 在 ai-chat-service/database/entities 中创建 llm-config.entity.ts
- 新增 LLM 配置管理 Service 层
- 新增 LLM 配置 CRUD API 路由
- 集成现有 LLMService 支持动态配置切换

## Impact

- 移除: `packages/core/src/entities/llm-config.entity.ts`
- 新增实体: `apps/ai-chat-service/src/database/entities/llm-config.entity.ts`
- 新增 DTO: `packages/dto` 添加 LLM 配置相关 DTO
- 新增数据库表: `llm_configs`
- 新增路由: `/api/llm-configs`
- 受影响模块: ai-chat-service, packages/core

## Migration

- packages/core 中的 llm-config.entity.ts 迁移到 ai-chat-service
- 更新 any imports from '@req2task/core' 指向新的 entity 位置

## ADDED Requirements

### Requirement: LLM 配置创建

系统应提供创建 LLM 配置的 API，支持配置名称、供应商、模型、API Key 等参数。

#### Scenario: 创建成功
- **WHEN** 用户提交有效的 LLM 配置
- **THEN** 返回配置 ID，系统保存配置到数据库

#### Scenario: 参数验证失败
- **WHEN** 用户提交无效的配置参数
- **THEN** 返回 400 错误，包含验证错误详情

### Requirement: LLM 配置查询

系统应提供查询 LLM 配置列表和详情的 API。

#### Scenario: 获取配置列表
- **WHEN** 用户请求配置列表
- **THEN** 返回分页的配置列表（不包含 API Key 明文）

#### Scenario: 获取配置详情
- **WHEN** 用户请求单个配置详情
- **THEN** 返回完整配置信息（API Key 仅在创建/更新时可见）

### Requirement: LLM 配置更新

系统应提供更新 LLM 配置的 API。

#### Scenario: 更新成功
- **WHEN** 用户更新现有配置
- **THEN** 返回更新后的配置信息

### Requirement: LLM 配置删除

系统应提供删除 LLM 配置的 API。

#### Scenario: 删除成功
- **WHEN** 用户删除现有配置
- **THEN** 返回 204 状态码

### Requirement: LLM 配置测试

系统应提供测试 LLM 配置可用性的 API。

#### Scenario: 测试成功
- **WHEN** 用户提交配置测试请求
- **THEN** 返回测试结果（成功/失败/错误信息）

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/llm-configs | 创建配置 |
| GET | /api/llm-configs | 获取配置列表 |
| GET | /api/llm-configs/:id | 获取配置详情 |
| PUT | /api/llm-configs/:id | 更新配置 |
| DELETE | /api/llm-configs/:id | 删除配置 |
| POST | /api/llm-configs/:id/test | 测试配置 |

## Data Model

```typescript
interface LLMConfig {
  id: string;
  name: string;
  provider: 'deepseek' | 'openai' | 'ollama';
  modelName: string;
  baseUrl?: string;
  apiKey?: string;  // 加密存储
  maxTokens: number;
  temperature: number;
  topP: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security

- API Key 存储时加密
- 查询接口不返回 API Key 明文
- 使用 API Key 时从数据库读取解密后使用
