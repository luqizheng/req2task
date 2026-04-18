# AI Chat 适配器

## 概述

适配器（Adapter）用于解决前端组件与后端 API 之间的数据格式差异，提供统一的消息转换接口。

## 当前适配器

### default（默认）

提供基础的消息格式转换功能：

| 方法 | 功能 |
|------|------|
| `toStandard` | 将外部消息格式转换为组件标准格式 |
| `fromStandard` | 将标准格式转换回外部格式 |
| `transformRequest` | 转换请求数据 |
| `transformResponse` | 转换响应数据 |

### 配置选项

```typescript
interface AdapterOptions {
  mapping?: DataMapping;          // 字段映射规则
  defaultValues?: Record<string, unknown>;  // 默认值
  requiredFields?: string[];        // 必填字段
}
```

## 使用方式

```typescript
import { adapterRegistry } from '@req2task/ai-chat';

// 转换外部消息
const message = adapterRegistry.toStandard('default', rawMessage);

// 注册新适配器
adapterRegistry.register({
  name: 'custom',
  toStandard: (msg) => ({ /* ... */ }),
  fromStandard: (msg) => ({ /* ... */ }),
});
```

## 添加新适配器

如需支持新的后端 API，可注册自定义适配器：

```typescript
import type { MessageAdapter } from '@req2task/ai-chat';

const backendAdapter: MessageAdapter = {
  name: 'backend',
  toStandard: (external) => {
    // 转换后端响应为组件标准格式
  },
  fromStandard: (standard) => {
    // 转换标准格式为后端请求格式
  },
  transformRequest: (request) => {
    // 请求转换
  },
  transformResponse: (response) => {
    // 响应转换
  },
};

adapterRegistry.register(backendAdapter);
```
