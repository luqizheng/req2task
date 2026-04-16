# LLM 配置模块 PRD

## 概述

LLM 配置模块提供统一的 LLM 服务配置管理，支持多提供商配置、默认配置设置和完整的 CRUD 操作。

## 问题背景

现有 LLM 管理设计文档已定义 API 端点，但缺少：
1. 明确的配置实体结构
2. 默认配置管理机制
3. 配置与调用的关联关系

## 核心需求

### 1. 配置实体结构
- 支持多提供商（DeepSeek、OpenAI、Ollama、MiniMax）
- 存储 API Key、Endpoint、模型等配置
- 支持默认配置标记

### 2. 默认配置机制
- 客户端不指定配置时使用默认配置
- 每个提供商可设置默认配置
- 系统级默认配置

### 3. 配置管理
- 完整的 CRUD 操作
- 配置启用/禁用状态
- 配置使用统计

## 功能规格

### 1. 配置实体设计

```typescript
interface LLMConfig {
  id: string;
  name: string;           // 配置名称
  provider: LLMProvider;  // 提供商类型
  modelId: string;        // 模型ID
  apiKey: string;         // API密钥（加密存储）
  apiEndpoint: string;    // API端点
  temperature?: number;   // 温度参数
  maxTokens?: number;     // 最大token数
  timeout?: number;       // 超时时间（毫秒）
  maxRetries?: number;    // 最大重试次数
  isDefault: boolean;     // 是否为默认配置
  isActive: boolean;      // 是否启用
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;      // 创建用户ID
}

type LLMProvider = 'deepseek' | 'openai' | 'ollama' | 'minimax';
```

### 2. 默认配置逻辑

#### 2.1 配置优先级
1. 客户端指定配置ID → 使用指定配置
2. 客户端指定提供商 → 使用该提供商的默认配置
3. 客户端未指定 → 使用系统默认配置

#### 2.2 默认配置规则
- 每个提供商只能有一个默认配置
- 系统默认配置必须是某个提供商的默认配置
- 设置新默认配置时，自动取消旧默认配置

### 3. API 设计

#### 3.1 配置管理 API

**创建配置**
```http
POST /api/llm/configs
Content-Type: application/json

{
  "name": "DeepSeek 生产配置",
  "provider": "deepseek",
  "modelId": "deepseek-chat",
  "apiKey": "sk-xxx",
  "apiEndpoint": "https://api.deepseek.com/v1",
  "temperature": 0.7,
  "maxTokens": 2000,
  "isDefault": true
}
```

**获取配置列表**
```http
GET /api/llm/configs
Query Params:
- provider?: string      # 按提供商过滤
- activeOnly?: boolean   # 只返回启用配置
- page?: number         # 页码
- limit?: number        # 每页数量
```

**获取单个配置**
```http
GET /api/llm/configs/:id
```

**更新配置**
```http
PUT /api/llm/configs/:id
Content-Type: application/json

{
  "temperature": 0.8,
  "isDefault": true
}
```

**删除配置**
```http
DELETE /api/llm/configs/:id
```

**设置默认配置**
```http
POST /api/llm/configs/:id/set-default
```

#### 3.2 配置使用 API

**使用指定配置调用**
```http
POST /api/llm/call/config/:configId
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "你好" }]
}
```

**使用提供商默认配置调用**
```http
POST /api/llm/call/provider/:provider
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "你好" }]
}
```

**使用系统默认配置调用**
```http
POST /api/llm/call
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "你好" }]
}
```

### 4. 服务层设计

#### 4.1 LLM 配置服务
```typescript
interface ILLMConfigService {
  // 配置管理
  createConfig(dto: CreateLLMConfigDto): Promise<LLMConfig>;
  getConfigs(filters: ConfigFilters): Promise<PaginatedConfigs>;
  getConfigById(id: string): Promise<LLMConfig>;
  updateConfig(id: string, dto: UpdateLLMConfigDto): Promise<LLMConfig>;
  deleteConfig(id: string): Promise<void>;
  setDefaultConfig(id: string): Promise<LLMConfig>;
  
  // 配置获取
  getDefaultConfig(): Promise<LLMConfig>;
  getDefaultConfigByProvider(provider: LLMProvider): Promise<LLMConfig>;
  getConfigForUse(configId?: string, provider?: LLMProvider): Promise<LLMConfig>;
  
  // 配置验证
  validateConfig(config: LLMConfig): Promise<boolean>;
}
```

#### 4.2 配置解析逻辑
```typescript
async getConfigForUse(configId?: string, provider?: LLMProvider): Promise<LLMConfig> {
  // 1. 如果指定了配置ID，使用该配置
  if (configId) {
    return this.getConfigById(configId);
  }
  
  // 2. 如果指定了提供商，使用该提供商的默认配置
  if (provider) {
    return this.getDefaultConfigByProvider(provider);
  }
  
  // 3. 使用系统默认配置
  return this.getDefaultConfig();
}
```

### 5. 数据库设计

#### 5.1 实体定义
```sql
CREATE TABLE llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('deepseek', 'openai', 'ollama', 'minimax')),
  model_id VARCHAR(100) NOT NULL,
  api_key TEXT NOT NULL,           -- 加密存储
  api_endpoint VARCHAR(500) NOT NULL,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  timeout INTEGER DEFAULT 30000,
  max_retries INTEGER DEFAULT 3,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_llm_configs_provider ON llm_configs(provider);
CREATE INDEX idx_llm_configs_is_default ON llm_configs(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_llm_configs_is_active ON llm_configs(is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_llm_configs_provider_default ON llm_configs(provider) WHERE is_default = TRUE;
```

#### 5.2 约束
- 每个提供商只能有一个默认配置（唯一约束）
- API Key 必须加密存储
- 配置名称在提供商内唯一

### 6. 安全设计

#### 6.1 API Key 加密
- 使用 AES-256-GCM 加密 API Key
- 加密密钥存储在环境变量中
- 数据库只存储加密后的密文

#### 6.2 权限控制
- 创建配置：需要管理员权限
- 更新/删除配置：需要配置所有者或管理员权限
- 获取配置：所有认证用户可查看（API Key 脱敏）

#### 6.3 响应脱敏
```typescript
class LLMConfigResponseDto {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  apiEndpoint: string;
  temperature?: number;
  maxTokens?: number;
  isDefault: boolean;
  isActive: boolean;
  // API Key 不包含在响应中
}
```

### 7. 错误处理

#### 7.1 错误类型
```typescript
enum LLMConfigError {
  CONFIG_NOT_FOUND = 'LLM_CONFIG_NOT_FOUND',
  PROVIDER_NOT_SUPPORTED = 'LLM_PROVIDER_NOT_SUPPORTED',
  DUPLICATE_DEFAULT_CONFIG = 'DUPLICATE_DEFAULT_CONFIG',
  INVALID_API_KEY = 'INVALID_API_KEY',
  CONFIG_VALIDATION_FAILED = 'CONFIG_VALIDATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

#### 7.2 错误响应
```json
{
  "error": "DUPLICATE_DEFAULT_CONFIG",
  "message": "每个提供商只能有一个默认配置",
  "details": {
    "provider": "deepseek",
    "existingConfigId": "123456"
  }
}
```

### 8. 配置验证

#### 8.1 创建时验证
- API Key 格式验证
- API Endpoint 可达性测试
- 模型兼容性检查

#### 8.2 定期健康检查
- 定时验证配置可用性
- 自动禁用不可用配置
- 发送告警通知

### 9. 使用统计

#### 9.1 统计指标
- 配置使用次数
- 调用成功率
- 平均响应时间
- 错误类型分布

#### 9.2 统计 API
```http
GET /api/llm/configs/:id/metrics
Query Params:
- startDate?: string    # 开始日期
- endDate?: string      # 结束日期
```

### 10. 环境变量配置

```env
# LLM 配置模块
LLM_CONFIG_ENCRYPTION_KEY=your-encryption-key-here
LLM_CONFIG_VALIDATION_ENABLED=true
LLM_CONFIG_HEALTH_CHECK_INTERVAL=300000  # 5分钟
LLM_CONFIG_MAX_DEFAULT_CONFIGS=1
```

### 11. 集成点

#### 11.1 与现有 LLM 服务集成
```typescript
// LLM 服务使用配置
class LLMService {
  constructor(private configService: ILLMConfigService) {}
  
  async call(request: LLMRequest, configId?: string, provider?: LLMProvider) {
    // 获取配置
    const config = await this.configService.getConfigForUse(configId, provider);
    
    // 使用配置调用 LLM
    return this.providerFactory
      .getProvider(config.provider)
      .call(config, request);
  }
}
```

#### 11.2 与需求 AI 模块集成
```typescript
// 需求 AI 服务使用默认配置
class RequirementAIService {
  async generateRequirement(prompt: string) {
    // 使用系统默认配置
    return this.llmService.call(
      { messages: [{ role: "user", content: prompt }] }
    );
  }
}
```

### 12. 测试策略

#### 12.1 单元测试
- 配置服务逻辑测试
- 默认配置规则测试
- 配置验证测试

#### 12.2 集成测试
- API 端点测试
- 数据库操作测试
- 加密/解密测试

#### 12.3 E2E 测试
- 完整配置管理流程
- 配置使用流程
- 错误处理流程

### 13. 部署要求

#### 13.1 数据库迁移
- 创建 llm_configs 表
- 添加必要索引
- 初始化默认配置（可选）

#### 13.2 环境配置
- 设置加密密钥
- 配置健康检查间隔
- 设置权限策略

### 14. 监控告警

#### 14.1 监控指标
- 配置创建/更新频率
- 默认配置使用频率
- 配置验证失败率

#### 14.2 告警规则
- 无可用默认配置时告警
- 配置验证连续失败时告警
- API Key 即将过期时告警

### 15. 未来扩展

#### 15.1 短期扩展
- 配置版本管理
- 配置导入/导出
- 配置模板功能

#### 15.2 长期扩展
- 多租户配置隔离
- 配置自动轮换
- 智能配置推荐

## 总结

LLM 配置模块提供完整的配置管理能力，支持多提供商、默认配置机制和安全存储。通过统一的配置接口，简化 LLM 服务调用，提高系统可维护性和安全性。