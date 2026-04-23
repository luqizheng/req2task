# Sprint 05: AI 配置与对话

**计划类型**: 前端开发计划
**目标**: 实现 AI 配置管理、通用对话功能
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M3

---

## 1. 目标

实现 AI 配置管理、通用对话功能。使用 `@req2task/ai-chat` 组件库。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| API: ai.ts | 6h | P0 | ⏳ |
| Store: ai.ts | 6h | P0 | ⏳ |
| AiConfigView.vue | 8h | P0 | ⏳ |
| AI Chat 集成 (使用 ai-chat 组件) | 8h | P0 | ⏳ |
| 后端 SSE 接口适配 | 4h | P1 | ⏳ |
| 适配器配置 | 4h | P1 | ⏳ |

**总预估工时**: 36h

---

## 3. 交付物

- AiConfigView.vue - AI 配置页面
- AI Chat 组件集成
- SSE 接口适配器

---

## 4. 验收标准

- [ ] 可配置 LLM
- [ ] 可进行 AI 对话
- [ ] 可切换 AI 配置

---

## 5. 页面结构

### 5.1 AiConfigView.vue

```
AI 配置页面
├── LLM 配置列表
│   ├── 配置卡片
│   │   ├── 提供商 (DeepSeek/OpenAI)
│   │   ├── 模型名称
│   │   ├── API Key (加密显示)
│   │   └── 操作按钮
│   └── 添加配置按钮
└── 配置表单
    ├── 提供商选择
    ├── 模型选择
    ├── API Key 输入
    ├── Base URL
    └── 测试连接按钮
```

---

## 6. AI Chat 集成

### 6.1 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AIChat } from '@req2task/ai-chat'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const chatRef = ref()

const config = {
  endpoint: '/api/ai/chat',
  headers: {
    Authorization: `Bearer ${userStore.token}`
  },
  userRoleName: '我',
  assistantRoleName: 'AI 助手'
}
</script>

<template>
  <AIChat
    ref="chatRef"
    :config="config"
    title="AI 助手"
    placeholder="输入消息..."
    @error="handleError"
  />
</template>
```

### 6.2 暴露的方法

```typescript
// 清除对话
chatRef.value?.clearMessages()

// 获取消息历史
const messages = chatRef.value?.getMessages()

// 停止生成
chatRef.value?.stopStream()

// 获取会话 ID
const sessionId = chatRef.value?.getConversationId()

// 设置会话 ID
chatRef.value?.setConversationId('session-xxx')

// 滚动到底部
chatRef.value?.scrollToBottom()
```

### 6.3 事件监听

```vue
<template>
  <AIChat
    @message-sent="onMessageSent"
    @message-received="onMessageReceived"
    @stream-start="onStreamStart"
    @stream-end="onStreamEnd"
    @error="onError"
    @conversation-created="onConversationCreated"
  />
</template>
```

---

## 7. 路由配置

```typescript
{
  path: '/ai/config',
  name: 'AiConfigView',
  component: AiConfigView
}
```

---

## 8. API 设计

### 8.1 LLM Config API

```typescript
// API 调用层
GET    /ai/llm-configs                    // 配置列表
GET    /ai/llm-configs/:id                // 详情
POST   /ai/llm-configs                    // 创建
PUT    /ai/llm-configs/:id                // 更新
DELETE /ai/llm-configs/:id                // 删除
```

### 8.2 AI Chat API

```typescript
// 后端 SSE 接口
POST   /ai/chat                           // 通用对话
POST   /ai/ai-chat                        // 带上下文的对话
```

---

## 9. 后端 SSE 接口要求

```typescript
// 请求格式
POST /api/ai/chat
Content-Type: application/json

{
  "message": "用户输入",
  "sessionId": "可选的会话ID",
  "conversationId": "可选的对话ID"
}

// 响应格式 (SSE)
Content-Type: text/event-stream

data: {"type": "content", "content": "AI 回复内容1"}

data: {"type": "content", "content": "AI 回复内容2"}

data: {"type": "metadata", "conversationId": "xxx"}

data: [DONE]
```

---

## 10. 依赖关系

- **前置条件**: Sprint 4 任务管理完成
- **后续 Sprint**: Sprint 6 需要 AI Chat 组件

---

## 11. 完成标准

- [ ] AI 配置页面功能完整
- [ ] AI Chat 组件正常工作
- [ ] SSE 流式响应正常
- [ ] 配置可正常切换

---

**上一 Sprint**: [Sprint 04: 任务管理](sprint-04-frontend-task-management.md)
**下一 Sprint**: [Sprint 06: AI 需求生成](sprint-06-frontend-ai-requirement-gen.md)
