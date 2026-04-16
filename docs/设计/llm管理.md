# LLM 服务模块

## 概述

本模块提供统一的LLM（大语言模型）服务封装，支持多种提供商，并提供完整的配置管理功能。

## 特性

- 多提供商支持：DeepSeek、OpenAI、Ollama、MiniMax
- 流式响应支持：SSE 流式输出
- 请求重试机制：自动重试失败请求
- 超时控制：默认30秒超时
- 健康监控：实时监控各提供商状态
- 指标收集：追踪调用次数、延迟等指标
- 工厂模式：统一的LLM服务获取接口
- 配置管理：完整的 CRUD API 管理 LLM 配置
- 调用日志：详细的调用记录和统计分析
- 追问问题生成：基于需求分析的智能追问

## 支持的提供商

### 1. DeepSeek

- **模型**: deepseek-chat
- **API Endpoint**: <https://api.deepseek.com/v1>
- **特性**: 函数调用、流式响应

### 2. OpenAI

- **模型**: gpt-4o
- **API Endpoint**: <https://api.openai.com/v1>
- **特性**: 函数调用、视觉支持、流式响应

### 3. Ollama (本地)

- **模型**: llama3.1:8b
- **API Endpoint**: <http://localhost:11434/api>
- **特性**: 本地部署、流式响应

### 4. MiniMax

- **模型**: 需要配置
- **API Endpoint**: <https://api.minimaxi.com/anthropic>
- **特性**: 函数调用、流式响应

## API 端点

### LLM 调用 API

#### 1. 调用默认LLM服务

```http
POST /api/llm/call
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

#### 2. 流式调用默认LLM服务

```http
POST /api/llm/stream
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

#### 3. 调用指定提供商

```http
POST /api/llm/call/:provider
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "model": "deepseek-chat"
}
```

支持的 provider: deepseek, openai, ollama, minimax

#### 4. 流式调用指定提供商

```http
POST /api/llm/stream/:provider
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

#### 5. 使用指定配置调用

```http
POST /api/llm/call/config/:configId
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

#### 6. 使用指定配置流式调用

```http
POST /api/llm/stream/config/:configId
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

#### 7. 获取健康状态

```http
GET /api/llm/health
```

响应示例：

```json
[
  {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "isHealthy": true,
    "latency": 125,
    "lastCheckAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### 8. 获取使用指标

```http
GET /api/llm/metrics
```

响应示例：

```json
[
  {
    "totalCalls": 150,
    "successfulCalls": 145,
    "failedCalls": 5,
    "averageLatency": 230,
    "provider": "deepseek",
    "model": "deepseek-chat",
    "configId": "123456"
  }
]
```

### 配置管理 API

#### 1. 获取支持的提供商列表

```http
GET /api/llm/config/providers
```

#### 2. 创建配置

```http
POST /api/llm/config
Content-Type: application/json

{
  "name": "DeepSeek 配置",
  "provider": "deepseek",
  "modelId": "deepseek-chat",
  "apiKey": "sk-xxx",
  "apiEndpoint": "https://api.deepseek.com/v1",
  "isDefault": true
}
```

#### 3. 获取所有配置

```http
GET /api/llm/config?provider=deepseek&activeOnly=true&page=1&limit=10
```

#### 4. 获取默认配置

```http
GET /api/llm/config/default
```

#### 5. 获取指定提供商的配置

```http
GET /api/llm/config/provider/:provider
```

#### 6. 获取配置使用指标

```http
GET /api/llm/config/metrics?provider=deepseek&days=7
```

#### 7. 获取调用日志

```http
GET /api/llm/config/logs?provider=deepseek&page=1&limit=10
```

#### 8. 获取单个配置

```http
GET /api/llm/config/:id
```

#### 9. 更新配置

```http
PUT /api/llm/config/:id
Content-Type: application/json

{
  "temperature": 0.8
}
```

#### 10. 删除配置

```http
DELETE /api/llm/config/:id
```

#### 11. 设置默认配置

```http
POST /api/llm/config/:id/set-default
```

## 环境变量配置

```env
# DeepSeek API配置
LLM_DEEPSEEK_API_KEY=your-deepseek-api-key-here

# OpenAI API配置
LLM_OPENAI_API_KEY=your-openai-api-key-here

# MiniMax API配置
LLM_MINIMAX_API_KEY=your-minimax-api-key-here

# Ollama 配置（本地）
LLM_OLLAMA_API_ENDPOINT=http://localhost:11434/api

# 通用配置
LLM_TIMEOUT=30000
LLM_MAX_RETRIES=3
```

## 使用示例

### 在服务中注入使用

```typescript
import { Injectable } from "@nestjs/common";
import { LLMService } from "./llm/llm.service";

@Injectable()
export class MyService {
  constructor(private readonly llmService: LLMService) {}

  async generateResponse(prompt: string) {
    const response = await this.llmService.call({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return response.choices[0].message.content;
  }
}
```

### 使用指定提供商

```typescript
const response = await this.llmService.callWithProvider("openai", {
  messages: [{ role: "user", content: "请用英文回答" }],
});
```

### 使用指定配置

```typescript
const response = await this.llmService.callWithConfig(configId, {
  messages: [{ role: "user", content: "你好" }],
});
```

### 流式调用

```typescript
for await (const chunk of await this.llmService.stream(request)) {
  console.log(chunk);
}
```

### 访问工厂服务

```typescript
import { Injectable } from "@nestjs/common";
import { LLMFactoryService } from "./llm/llm-factory.service";

@Injectable()
export class MyService {
  constructor(private readonly llmFactory: LLMFactoryService) {}

  async getServiceByProvider(providerId: string) {
    return this.llmFactory.getService(providerId);
  }
}
```

## 重试机制

服务内置了指数退避重试机制：

- 初始延迟: 1秒
- 最大延迟: 10秒
- 最大重试次数: 3次

## 健康检查

系统会自动检查所有注册的LLM服务：

```typescript
const statuses = await this.factory.getHealthStatus();
```

## 指标收集

系统自动收集以下指标：

- 总调用次数
- 成功调用次数
- 失败调用次数
- 平均延迟
- 最后调用时间

获取指标：

```typescript
const metrics = this.factory.getMetrics();
```

## Swagger 文档

访问 Swagger 文档查看完整的API说明：

```
http://localhost:3000/docs
```

## 注意事项

1. 配置管理 API 需要 JWT 认证
2. API Key 在响应中会被脱敏处理
3. 生产环境请配置有效的 API Key
4. 定期检查服务健康状态

## 扩展开发

### 添加新的提供商

1. 在 `providers/` 目录下创建新的提供商实现
2. 继承 `AbstractLLMProvider` 和 `AbstractLLMService`
3. 在 `LLMFactoryService` 中注册新的提供商

示例：

```typescript
// providers/my-provider.provider.ts
@Injectable()
export class MyProvider extends AbstractLLMProvider {
  readonly name = "MyProvider";
  readonly id = "my-provider" as const;

  createService(config: ILLMConfigDto): MyService {
    return new MyService(config);
  }

  protected getDefaultApiEndpoint(): string {
    return "https://api.my-provider.com/v1";
  }
}
```

## 故障排除

### 问题1: API调用失败

**症状**: 调用返回错误

**解决方案**:

1. 检查 API Key 是否正确配置
2. 确认网络连接正常
3. 查看日志获取详细错误信息

### 问题2: 超时错误

**症状**: 请求超时

**解决方案**:

1. 增加超时时间配置
2. 减少 maxTokens 参数
3. 检查网络延迟

### 问题3: 提供商不可用

**症状**: 某个提供商无法连接

**解决方案**:

1. 检查提供商服务状态
2. 切换到其他可用的提供商
3. 确认 API Endpoint 配置正确
