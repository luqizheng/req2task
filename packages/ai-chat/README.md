# @ai-sowf/ai-chat

## 概述

@ai-sowf/ai-chat 是一个基于 Vue 3 的 AI 聊天组件库，提供了完整的聊天界面和数据流处理功能，支持 Markdown 渲染、思考过程解析、SSE 流式响应等特性。

## 安装

### 依赖要求
- Vue 3.0+
- TypeScript 4.5+
- Element Plus（可选，用于UI组件）

### 安装命令

```bash
# 使用 pnpm
pnpm add @ai-sowf/ai-chat

# 使用 npm
npm install @ai-sowf/ai-chat

# 使用 yarn
yarn add @ai-sowf/ai-chat
```

## 核心功能

- **完整的聊天界面**：包含消息列表、输入区域、消息气泡等组件
- **Markdown 支持**：自动渲染 Markdown 格式的消息内容
- **思考过程解析**：自动识别和处理 `<think>...</think>` 标签
- **SSE 流式响应**：支持 Server-Sent Events 实时消息流
- **适配器系统**：提供数据适配层，解决前后端数据格式差异
- **会话管理**：支持会话创建、加载和管理
- **错误处理**：完善的错误处理机制
- **TypeScript 支持**：完整的类型定义

## 基本使用

### 1. 引入组件和样式

```vue
<script setup lang="ts">
import { AIChat } from '@ai-sowf/ai-chat';
import '@ai-sowf/ai-chat/dist/style.css';
</script>
```

### 2. 基本配置

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

<script setup lang="ts">
import { AIChat } from '@ai-sowf/ai-chat';
import '@ai-sowf/ai-chat/dist/style.css';
import { tokenUtils } from '@/utils/token';

const token = tokenUtils.getAccessToken();

function getHeaders() {
  return {
    Authorization: `Bearer ${token}`
  };
}
</script>
```

## 高级配置

### 1. 组件配置

| 属性 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `config` | `AIChatConfig` | 聊天配置 | `{}` |
| `headers` | `Record<string, string>` | 请求头 | `{}` |
| `title` | `string` | 聊天窗口标题 | `"AI Chat"` |
| `placeholder` | `string` | 输入框占位符 | `"Type your message..."` |
| `max-height` | `string` | 聊天窗口最大高度 | `"500px"` |
| `show-thinking` | `boolean` | 是否显示思考过程 | `true` |
| `show-timestamps` | `boolean` | 是否显示时间戳 | `false` |

### 2. 配置选项

```typescript
interface AIChatConfig {
  // API 端点
  endpoint: string;
  // 会话 ID
  sessionId?: string;
  // 用户角色名称
  userRoleName?: string;
  // AI 角色名称
  assistantRoleName?: string;
  // AI 头像 URL
  assistantAvatar?: string;
  // 用户头像 URL
  userAvatar?: string;
  // 请求超时时间（毫秒）
  timeout?: number;
}
```

## 适配器系统

### 内置适配器

- **default**：默认适配器，提供基本的消息转换
- **backend**：后端适配器，专门为 `/api/ai-generate/chat/stream` 接口设计

### 自定义适配器

```typescript
import type { MessageAdapter } from '@ai-sowf/ai-chat';
import { registerAdapter } from '@ai-sowf/ai-chat';

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
    // 自定义请求转换
    return request;
  },
  transformResponse: (response, options) => {
    // 自定义响应转换
    return response;
  }
};

// 注册适配器
registerAdapter(customAdapter);
```

## 事件处理

```vue
<AIChat
  @message-sent="handleMessageSent"
  @message-received="handleMessageReceived"
  @done="handleDone"
  @stream-start="handleStreamStart"
  @stream-end="handleStreamEnd"
  @error="handleError"
  @conversation-created="handleConversationCreated"
/>

<script setup lang="ts">
function handleMessageSent(message) {
  console.log('Message sent:', message);
}

function handleMessageReceived(message) {
  console.log('Message received:', message);
}

function handleDone(message, conversationId) {
  console.log('Chat done:', message, conversationId);
}

function handleStreamStart() {
  console.log('Stream started');
}

function handleStreamEnd() {
  console.log('Stream ended');
}

function handleError(error) {
  console.error('Error:', error);
}

function handleConversationCreated(conversationId) {
  console.log('Conversation created:', conversationId);
}
</script>
```

## 完整示例

### 基本聊天界面

```vue
<template>
  <div class="chat-container">
    <AIChat
      :config="{
        endpoint: '/api/ai-generate/chat/stream',
        userRoleName: '用户',
        assistantRoleName: 'AI助手',
      }"
      :headers="getHeaders()"
      title="AI 助手"
      placeholder="输入消息开始对话..."
      max-height="600px"
      @message-sent="handleMessageSent"
      @message-received="handleMessageReceived"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { AIChat } from '@ai-sowf/ai-chat';
import '@ai-sowf/ai-chat/dist/style.css';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

function getHeaders() {
  return {
    Authorization: `Bearer ${authStore.token}`
  };
}

function handleMessageSent(message) {
  console.log('消息发送:', message.content);
}

function handleMessageReceived(message) {
  console.log('消息接收:', message.content);
}

function handleError(error) {
  console.error('错误:', error.message);
}
</script>

<style scoped>
.chat-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
```

### 带会话管理的聊天界面

```vue
<template>
  <div class="chat-with-session">
    <div class="session-controls">
      <el-input
        v-model="sessionId"
        placeholder="输入会话ID"
        style="width: 300px;"
      />
      <el-button @click="loadSession">加载会话</el-button>
      <el-button @click="clearSession">清空会话</el-button>
    </div>
    
    <AIChat
      ref="chatRef"
      :config="{
        endpoint: '/api/ai-generate/chat/stream',
        userRoleName: '用户',
        assistantRoleName: 'AI助手',
      }"
      :headers="getHeaders()"
      title="AI 助手"
      placeholder="输入消息开始对话..."
      max-height="500px"
      @conversation-created="handleConversationCreated"
    />
    
    <div v-if="currentConversationId" class="session-info">
      当前会话ID: {{ currentConversationId }}
      <el-button size="small" @click="copySessionId">复制</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { AIChat } from '@ai-sowf/ai-chat';
import '@ai-sowf/ai-chat/dist/style.css';

const chatRef = ref(null);
const sessionId = ref('');
const currentConversationId = ref('');

function getHeaders() {
  return {
    // 添加认证头
  };
}

function loadSession() {
  if (sessionId.value) {
    chatRef.value?.setConversationId(sessionId.value);
    ElMessage.success('会话加载成功');
  }
}

function clearSession() {
  chatRef.value?.setConversationId(null);
  chatRef.value?.clearMessages();
  currentConversationId.value = '';
  sessionId.value = '';
  ElMessage.success('会话已清空');
}

function handleConversationCreated(conversationId) {
  currentConversationId.value = conversationId;
  sessionId.value = conversationId;
}

function copySessionId() {
  if (currentConversationId.value) {
    navigator.clipboard.writeText(currentConversationId.value);
    ElMessage.success('会话ID已复制');
  }
}
</script>

<style scoped>
.chat-with-session {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.session-controls {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.session-info {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

## API 参考

### 组件 API

#### AIChat

| 属性 | 类型 | 说明 |
|------|------|------|
| `config` | `AIChatConfig` | 聊天配置 |
| `headers` | `Record<string, string>` | 请求头 |
| `title` | `string` | 聊天窗口标题 |
| `placeholder` | `string` | 输入框占位符 |
| `max-height` | `string` | 聊天窗口最大高度 |
| `show-thinking` | `boolean` | 是否显示思考过程 |
| `show-timestamps` | `boolean` | 是否显示时间戳 |

| 方法 | 说明 | 参数 |
|------|------|------|
| `setConversationId` | 设置会话ID | `conversationId: string  null` |
| `clearMessages` | 清空消息 | 无 |
| `sendMessage` | 发送消息 | `content: string` |

| 事件 | 说明 | 回调参数 |
|------|------|----------|
| `message-sent` | 消息发送时触发 | `message: AIChatMessage` |
| `message-received` | 消息接收时触发 | `message: AIChatMessage` |
| `done` | 对话完成时触发 | `message: AIChatMessage, conversationId: string` |
| `stream-start` | 流式响应开始时触发 | 无 |
| `stream-end` | 流式响应结束时触发 | 无 |
| `error` | 错误时触发 | `error: Error` |
| `conversation-created` | 新会话创建时触发 | `conversationId: string` |

### 工具函数

#### 适配器相关

```typescript
// 注册适配器
registerAdapter(adapter: MessageAdapter): void

// 注销适配器
unregisterAdapter(name: string): void

// 获取适配器
getAdapter(name: string): MessageAdapter | undefined

// 获取所有适配器
getAllAdapters(): MessageAdapter[]

// 转换外部消息为标准格式
toStandard(name: string, externalMessage: unknown, options?: AdapterOptions): AIChatMessage

// 转换标准消息为外部格式
fromStandard(name: string, standardMessage: AIChatMessage, options?: AdapterOptions): unknown

// 转换请求数据
transformRequest(name: string, request: unknown, options?: AdapterOptions): unknown

// 转换响应数据
transformResponse(name: string, response: unknown, options?: AdapterOptions): unknown
```

#### 消息处理

```typescript
// 生成唯一ID
generateId(): string

// 解析思考过程
parseThinking(content: string): { text: string; thinking: string[] }

// 深度映射对象
deepMapObject(obj: Record<string, unknown>, mapping: Record<string, string>): Record<string, unknown>

// 转换类型
convertTypes(obj: Record<string, unknown>, typeMap: Record<string, string>): Record<string, unknown>

// 扁平化对象
flattenObject(obj: Record<string, unknown>, prefix: string = ''): Record<string, unknown>
```

## 错误处理

### 错误类型

- **AdapterError**：适配器错误
- **ValidationError**：数据验证错误
- **MappingError**：数据映射错误
- **TransformationError**：数据转换错误

### 错误处理示例

```typescript
import { handleAdapterError } from '@ai-sowf/ai-chat';

try {
  // 适配器操作
} catch (error) {
  const fallback = { /*  fallback data  */ };
  const result = handleAdapterError(error, fallback);
  // 使用 result
}
```

## 最佳实践

1. **合理配置端点**：确保 `endpoint` 指向正确的后端 API
2. **添加认证头**：根据后端要求添加适当的认证信息
3. **处理会话管理**：使用 `setConversationId` 方法管理会话
4. **监听事件**：通过事件回调处理消息状态和错误
5. **自定义适配器**：根据后端接口格式创建自定义适配器
6. **错误处理**：合理处理可能的错误情况

## 常见问题

### 1. 消息发送失败

- 检查 `endpoint` 是否正确
- 确认 `headers` 中包含必要的认证信息
- 检查网络连接
- 查看浏览器控制台错误信息

### 2. 流式响应不显示

- 确保后端返回正确的 SSE 格式
- 检查适配器的 `transformResponse` 方法是否正确处理响应
- 验证网络连接是否稳定

### 3. 适配器不生效

- 确保适配器已正确注册
- 检查适配器名称是否正确
- 验证适配器方法是否正确实现

### 4. 样式问题

- 确保已正确引入 `@ai-sowf/ai-chat/dist/style.css`
- 检查是否有 CSS 冲突
- 可以通过自定义 CSS 覆盖默认样式

## 开发与调试

### 本地开发

```bash
# 克隆仓库
git clone <repository-url>

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test
```

### 调试技巧

- 使用浏览器开发者工具查看网络请求
- 检查控制台日志
- 使用 `debugger` 断点调试
- 查看适配器转换前后的数据格式

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v0.1.0
- 初始版本
- 支持基本聊天功能
- 支持 Markdown 渲染
- 支持 SSE 流式响应
- 支持适配器系统
