# AI 录入框组件实现计划

## 需求分析

创建一个通用的 AI 录入框组件，支持：
1. **文本录入** - textarea 输入框
2. **音频上传** - 录音或选择音频文件
3. **项目附件上传** - 支持多文件上传
4. **提交功能** - 携带 Bearer token 提交

## Props 定义

```typescript
interface Props {
  url: string;           // 提交地址（必填）
  uploadFile?: boolean;  // 是否显示附件上传，默认 false
  audit?: boolean;       // 审核模式，默认 false
}
```

## 实现计划

### 1. Composable: `useAiSubmit.ts`
**位置**: `apps/web/src/composables/useAiSubmit.ts`

职责：
- 管理组件状态（文本、音频、附件列表、加载状态）
- 音频录制/停止逻辑（使用 MediaRecorder API）
- 附件上传逻辑（复用 attachmentApi）
- 提交逻辑（携带 Bearer token）
- 状态重置

### 2. 主组件: `ai-submit/index.vue`
**位置**: `apps/web/src/components/ai-submit/index.vue`

UI 结构：
```
┌─────────────────────────────────────┐
│  文本输入框 (textarea)               │
├─────────────────────────────────────┤
│  [🎤 录音] [📎 音频文件] [📎 附件]   │  ← 根据 props 显示
├─────────────────────────────────────┤
│  已上传附件列表（可删除）             │
├─────────────────────────────────────┤
│  [取消]                    [提交]    │
└─────────────────────────────────────┘
```

### 3. 样式规范

遵循项目 DESIGN-RULES.md：
- 使用 Element Plus 组件
- AI 特性使用紫色 `#6366f1`
- 主题色 `#2563eb`
- 间距系统：12px/16px/20px
- scoped CSS

## 技术要点

1. **音频录制**: MediaRecorder API，支持 .webm/.wav 格式
2. **Token 认证**: 从 localStorage 获取 `accessToken`
3. **文件上传**: 使用项目已有的 `attachmentApi`
4. **类型安全**: 完整 TypeScript 类型定义

## 文件清单

- [新建] `apps/web/src/composables/useAiSubmit.ts`
- [修改] `apps/web/src/components/ai-submit/index.vue`（当前为空文件）

## 验收标准

- [ ] 支持文本输入
- [ ] 支持音频录制和上传
- [ ] 支持附件多文件上传（uploadFile=true 时）
- [ ] 提交时自动携带 Bearer token
- [ ] 符合项目组件规范和设计规范
- [ ] 类型检查通过
