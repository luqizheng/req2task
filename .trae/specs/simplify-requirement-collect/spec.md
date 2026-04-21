# 简化需求收集视图 Spec

## Why
当前需求收集界面使用 AI Chat 组件，交互复杂。用户实际需要的是简单的文本输入功能，AI 分析和附件上传可以后续实现。

## What Changes
- 移除 AIChat 组件，改用简单的文本输入框
- 保留需求文件上传 UI（录音、文档等）
- 保留项目附件上传 UI
- 删除 `/collections/{id}/chat` 接口
- 删除 `/collections/{id}/analyze` 接口（非 stream 版本）
- 扩展 `/collections/{id}/analyze/stream` 接口的请求体

## Impact
- Affected specs: 需求收集视图简化
- Affected code:
  - `apps/web/src/views/RawRequirementCollectView/RawRequirementCollectView.vue`
  - `apps/web/src/views/RawRequirementCollectView/components/RequirementChatPanel.vue`
  - `apps/web/src/api/requirementCollection.ts`
  - `apps/web/src/stores/requirementCollect.ts`
  - `apps/service/src/raw-requirement-collection/raw-requirement-collection.controller.ts`

## ADDED Requirements
### Requirement: 简化输入面板
用户可以输入原始需求、上传需求文件、上传项目附件。

#### Scenario: 提交需求
- **WHEN** 用户填写表单并点击提交
- **THEN** 调用 `/collections/{id}/analyze/stream` 接口提交三类内容

### Requirement: analyze/stream 请求体扩展
请求体包含三类内容：

```typescript
interface RequirementAnalyzeBody {
  rawRequirementText: string;        // 原始需求文本（包含多个原始需求）
  requirementFiles?: File[];          // 需求文件（会议录音、客户电话录音等）
  projectAttachments?: File[];         // 项目附件（从客户获取的附件）
  configId?: string;
}
```

## MODIFIED Requirements
### Requirement: stream 接口
保留 `/collections/{id}/analyze/stream` 接口，扩展请求体支持三类内容。

## REMOVED Requirements
### Requirement: chat 接口
**Reason**: 用户不需要复杂的 AI 对话交互
**Migration**: 移除 `/collections/{id}/chat` 接口

### Requirement: analyze 非 stream 接口
**Reason**: 只保留 stream 接口
**Migration**: 移除 `/collections/{id}/analyze` 接口

### Requirement: AI Chat 对话功能
**Reason**: 用户不需要复杂的 AI 对话交互
**Migration**: 提供简单的文本输入即可

### Requirement: 追问进度显示
**Reason**: 简化交互，不需要追问流程
**Migration**: 移除相关 UI

### Requirement: 会话历史
**Reason**: 不再需要保存对话历史
**Migration**: 移除 chatHistory 相关状态
