# AI Chat 适配器使用文档

## 1. 适配器概述

适配器（Adapter）用于解决前端组件与后端服务器之间的数据交互差异问题，提供统一的接口进行数据格式转换和映射。

## 2. 核心功能

- **请求转换**：将组件提供的数据格式转换为服务器要求的格式
- **响应转换**：将服务器返回的数据格式处理为组件可直接使用的格式
- **数据映射**：处理前后端数据字段映射关系，解决命名差异、类型转换等问题
- **错误处理**：提供完善的错误处理机制，确保适配过程的稳定性

## 3. 内置适配器

### 3.1 默认适配器（default）
- 提供基本的消息转换功能
- 支持标准消息格式与外部格式的相互转换

### 3.2 后端适配器（backend）
- 专门为后端 `/api/ai-generate/chat/stream` 接口设计
- 处理前后端数据格式差异
- 支持流式响应转换

## 4. 基本使用方法

### 4.1 配置适配器

在使用 AI Chat 组件时，适配器会自动使用 `backend` 适配器与后端接口进行交互：

```vue
<template>
  <AIChat
    :config="{
      endpoint: '/api/ai-generate/chat/stream',
      userRoleName: '用户',
      assistantRoleName: 'AI助手',
    }"
    :headers="getHeaders()"
    title="AI 助手"
    placeholder="输入消息开始对话..."
  />
</template>
```

### 4.2 自定义适配器

如果需要自定义适配器，可以按照以下步骤：

1. **创建适配器**：
```typescript
import type { MessageAdapter } from '@ai-sowf/ai-chat';

const customAdapter: MessageAdapter = {
  name: 'custom',
  toStandard: (externalMessage, options) => {
    // 自定义转换逻辑
    return {
      id: '...',
      role: 'user',
      content: '...',
      createdAt: new Date()
    };
  },
  fromStandard: (standardMessage, options) => {
    // 自定义转换逻辑
    return {
      id: standardMessage.id,
      text: standardMessage.content,
      type: standardMessage.role
    };
  },
  transformRequest: (request, options) => {
    // 自定义请求转换逻辑
    return request;
  },
  transformResponse: (response, options) => {
    // 自定义响应转换逻辑
    return response;
  }
};
```

2. **注册适配器**：
```typescript
import { registerAdapter } from '@ai-sowf/ai-chat';

registerAdapter(customAdapter);
```

3. **使用自定义适配器**：
```typescript
// 在 useStream 调用中指定适配器名称
await startStream({
  endpoint: '/api/custom-endpoint',
  adapterName: 'custom',
  // 其他参数...
});
```

## 5. 适配器配置选项

适配器支持以下配置选项：

| 选项 | 类型 | 描述 |
|------|------|------|
| `mapping` | `DataMapping` | 数据映射规则，用于处理字段命名差异 |
| `defaultValues` | `Record<string, unknown>` | 默认值，确保数据完整性 |
| `requiredFields` | `string[]` | 必填字段，用于数据验证 |

### 5.1 数据映射示例

```typescript
const mapping = {
  // 简单字段映射
  id: 'messageId',
  content: 'text',
  // 嵌套字段映射
  user: {
    name: 'user.name',
    email: 'user.email'
  }
};
```

### 5.2 完整配置示例

```typescript
const adapterOptions = {
  mapping: {
    id: 'message_id',
    content: 'text'
  },
  defaultValues: {
    status: 'done',
    role: 'user'
  },
  requiredFields: ['id', 'content']
};
```

## 6. 适配器 API

### 6.1 适配器注册表

```typescript
import { adapterRegistry } from '@ai-sowf/ai-chat';

// 注册适配器
adapterRegistry.register(customAdapter);

// 获取适配器
const adapter = adapterRegistry.get('backend');

// 转换外部消息为标准格式
const standardMessage = adapterRegistry.toStandard('backend', externalMessage);

// 转换标准消息为外部格式
const externalMessage = adapterRegistry.fromStandard('backend', standardMessage);

// 转换请求数据
const transformedRequest = adapterRegistry.transformRequest('backend', requestData);

// 转换响应数据
const transformedResponse = adapterRegistry.transformResponse('backend', responseData);
```

### 6.2 适配器接口

```typescript
interface MessageAdapter {
  name: string;
  toStandard: (externalMessage: unknown, options?: AdapterOptions) => AIChatMessage;
  fromStandard: (standardMessage: AIChatMessage, options?: AdapterOptions) => unknown;
  transformRequest?: (request: unknown, options?: AdapterOptions) => unknown;
  transformResponse?: (response: unknown, options?: AdapterOptions) => unknown;
}
```

## 7. 示例场景

### 7.1 基本使用场景

```vue
<script setup lang="ts">
import { AIChat } from '@ai-sowf/ai-chat';
import { useAuthStore } from '@/stores/auth';
import { tokenUtils } from '@/utils/token';

const authStore = useAuthStore();
const token = tokenUtils.getAccessToken();

function getHeaders() {
  return {
    Authorization: `Bearer ${token}`
  };
}
</script>

<template>
  <AIChat
    :config="{
      endpoint: '/api/ai-generate/chat/stream',
      userRoleName: '用户',
      assistantRoleName: 'AI助手',
    }"
    :headers="getHeaders()"
    title="AI 助手"
    placeholder="输入消息开始对话..."
    max-height="500px"
  />
</template>
```

### 7.2 自定义适配器场景

```typescript
// 创建自定义适配器
const customAdapter: MessageAdapter = {
  name: 'custom-backend',
  transformRequest: (request) => {
    const req = request as Record<string, unknown>;
    return {
      message: req.message || '',
      conversation_id: req.conversationId,
      user_id: '123' // 添加额外字段
    };
  },
  transformResponse: (response) => {
    const res = response as Record<string, unknown>;
    if (res.text) {
      return {
        type: 'content',
        content: res.text
      };
    }
    return response;
  },
  // 其他方法...
};

// 注册适配器
registerAdapter(customAdapter);

// 在组件中使用
<AIChat
  :config="{
    endpoint: '/api/custom-chat/stream',
    // 适配器会在内部使用
  }"
  title="AI 助手"
/>
```

## 8. 错误处理

适配器提供了完善的错误处理机制：

- **ValidationError**：数据验证错误，如缺少必填字段
- **MappingError**：数据映射错误
- **TransformationError**：数据转换错误

错误会被自动捕获并处理，确保应用的稳定性。

## 9. 最佳实践

1. **模块化设计**：将不同后端服务的适配器分离为独立模块
2. **统一接口**：使用统一的适配器接口，便于组件调用
3. **错误处理**：合理处理适配过程中的错误，确保系统稳定性
4. **测试覆盖**：为适配器编写单元测试，确保功能正确性
5. **文档完善**：详细记录适配器的使用方法和配置选项

## 10. 常见问题

### 10.1 适配器不生效

- 确保适配器已正确注册
- 检查适配器名称是否正确
- 验证适配器方法是否正确实现

### 10.2 数据转换错误

- 检查数据映射规则是否正确
- 确保字段类型匹配
- 验证必填字段是否存在

### 10.3 流式响应问题

- 确保后端返回正确的 SSE 格式
- 检查适配器的 transformResponse 方法是否正确处理流式数据

通过以上配置和使用方法，您可以轻松实现前端组件与后端接口之间的数据无缝对接，解决数据格式差异问题。