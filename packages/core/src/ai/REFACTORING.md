# AI 模块重构说明文档

## 概述

本次重构针对 `packages/core/src/ai` 目录下的 AI 相关代码，旨在提升代码可维护性、消除冗余代码、增强错误处理能力，并确保符合项目编码标准。

## 重构前后对比

### 1. LLM Provider 架构

#### 重构前问题
- `OpenAIProvider` 和 `DeepSeekProvider` 代码高度重复（约 55 行重复代码）
- 缺少重试机制
- 缺少超时配置
- 错误处理不完善

#### 重构后方案
新增 `BaseLLMProvider` 抽象基类，统一处理通用逻辑：

```
src/ai/
├── llm-provider.interface.ts   # 接口定义
├── base-llm-provider.ts         # 新增：抽象基类（新增）
├── openai.provider.ts           # 精简至 17 行
├── deepseek.provider.ts        # 精简至 17 行
```

**关键改进**：
- 请求重试机制（指数退避，最多 3 次重试）
- 30 秒默认超时配置
- 统一错误处理和日志记录
- 可配置重试的错误码：408、429、500+

### 2. LLM Service

#### 重构前问题
```typescript
// 冗余方法
async chat(messages, configId?) {
  return this.generate(messages, configId); // 与 generate 完全相同
}
async chatWithConfig(messages, configId?, options?) {
  // 另一个变体
}
```

#### 重构后方案
```typescript
// 统一方法
async generate(messages, configId?, options?): Promise<LLMResponse>

// 新增功能
async checkProviderHealth(configId?): Promise<{ isAvailable, provider }>
clearCache(): void
invalidateCache(configId): Promise<void>
```

**关键改进**：
- 消除冗余方法（`chat`、`chatWithConfig` 合并）
- 新增 Provider 健康检查
- 支持缓存失效机制
- 完善的日志记录（Token 使用统计）

### 3. Vector Store

#### 重构前问题
```typescript
async deleteByFilter(filter) {
  // 内联 filter 匹配逻辑
  for (...) {
    let match = true;
    for (...) { ... }
    if (match) toDelete.push(id);
  }
}
```

#### 重构后方案
```typescript
private matchesFilter(doc, filter): boolean { ... }
async deleteByFilter(filter) { ... }

// 新增工具方法
getDocumentCount(): number
clear(): void
```

**关键改进**：
- 提取 `matchesFilter` 私有方法，提升可读性
- 新增文档计数和清空方法
- 移除内联 filter 逻辑
- 优化代码结构

### 4. 类型定义

#### 重构前
```typescript
export interface LLMProvider {
  generate(messages, options?): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}
```

#### 重构后
```typescript
export interface LLMProvider {
  readonly providerType: LLMProviderType; // 新增
  generate(messages, options?): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean; // 新增
}
```

## 关键改进点

| 改进项 | 重构前 | 重构后 |
|--------|--------|--------|
| Provider 代码行数 | 57 行 × 2 | 17 行 × 2 + 130 行基类 |
| 重试机制 | 无 | 指数退避，最多重试 3 次 |
| 超时配置 | 无 | 30 秒默认 |
| 测试覆盖 | 无 | 3 个测试文件 |
| 缓存管理 | 基础 | 支持失效机制 |
| 日志记录 | 无 | 结构化日志 |

## 新增文件

```
src/ai/
├── base-llm-provider.ts          # 抽象基类（75 行）
├── chroma-vector-store.spec.ts   # Vector Store 测试（170 行）
├── llm.service.spec.ts           # LLM Service 测试（120 行）
└── openai.provider.spec.ts       # Provider 测试（130 行）
```

## 性能优化

1. **Provider 缓存**：相同配置复用 Provider 实例
2. **指数退避重试**：减少服务器压力
3. **请求超时**：防止无限等待

## 依赖管理

- 遵循 core 包规范，**不依赖** `@nestjs/common`
- 使用 `console.log/warn/error` 进行日志输出
- 依赖：`axios`、`typeorm`、`@req2task/dto`

## 测试覆盖

| 文件 | 测试用例数 |
|------|-----------|
| `chroma-vector-store.spec.ts` | 12 |
| `llm.service.spec.ts` | 7 |
| `openai.provider.spec.ts` | 8 |
| **总计** | **27** |

## 兼容性说明

本次重构保持 API 向后兼容：

1. `LLMService.generate()` 替代原 `chat()` 和 `chatWithConfig()`
2. Provider 实例行为不变
3. Vector Store 接口不变

## 后续建议

1. **添加真实 Chroma 集成**：当前 `ChromaVectorStore` 为内存实现
2. **实现 Ollama Provider**：当前 OLLAMA 类型复用 OpenAI Provider
3. **添加流式响应支持**：接口已定义 `stream` 选项
4. **集成结构化日志**：可考虑使用 pino 或 winston
