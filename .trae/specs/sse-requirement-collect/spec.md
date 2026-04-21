# SSE 需求收集接口规范

## Why
现有的 `chatCollect` 和 `streamChatCollect` 接口设计不够合理，无法满足需求分析师在实际场景中的使用。需要一个统一的 SSE 流式接口，支持文字、录音和附件的组合输入。

## What Changes

### 删除的接口
- `POST /raw-requirements/:rawRequirementId/chat` - 旧版非流式接口
- `POST /raw-requirements/:rawRequirementId/stream` - 旧版流式代理接口

### 新增接口
- `POST /raw-requirements/:rawRequirementId/collect` - 新版 SSE 需求收集接口

### 新增 DTO
- `CollectRequirementDto` - 需求收集请求 DTO

## Impact
- **影响的包**: `@req2task/service`, `@req2task/dto`
- **依赖服务**: 
  - `file-conversion` - 音频转写
  - `ai-chat-service` - AI 对话和流式响应

## ADDED Requirements

### Requirement: SSE 需求收集接口
系统必须提供 SSE 流式接口，支持多种输入方式的组合。

#### Scenario: 纯文字需求收集
- **WHEN** 用户提交文字需求
- **THEN** 返回 AI 流式响应
- **AND** 需求保存到 `RawRequirement`

#### Scenario: 录音文件需求收集
- **WHEN** 用户提交录音文件
- **THEN** 录音转写为文字后，与 AI 交互
- **AND** 返回流式响应

#### Scenario: 带附件的需求收集
- **WHEN** 用户提交文字、录音和项目附件
- **THEN** 录音转写，附件关联到项目
- **AND** 所有内容发送给 AI 处理
- **AND** 返回流式响应

### Requirement: SSE 响应格式
SSE 响应必须遵循统一格式。

#### Scenario: 内容块响应
- **WHEN** AI 返回内容块
- **THEN** 发送 `data: {"type":"content","content":"..."}`

#### Scenario: 元数据响应
- **WHEN** AI 返回元数据（如后续问题、关键要素）
- **THEN** 发送 `data: {"type":"metadata","followUpQuestions":[...],"keyElements":[...]}`

#### Scenario: 完成响应
- **WHEN** AI 返回完成信号
- **THEN** 发送 `data: {"type":"done"}`

#### Scenario: 错误响应
- **WHEN** 处理过程中发生错误
- **THEN** 发送 `data: {"type":"error","error":"..."}`

### Requirement: 文件处理
系统必须处理录音文件转写和附件关联。

#### Scenario: 录音转写
- **WHEN** 提交包含 `audioFile` 的请求
- **THEN** 调用 `file-conversion` 服务转写音频
- **THEN** 将转写结果作为用户输入

#### Scenario: 项目附件关联
- **WHEN** 提交包含 `attachmentIds` 的请求
- **THEN** 验证附件存在
- **AND** 附件关联到指定项目

## MODIFIED Requirements

### Requirement: 旧接口废弃
**Reason**: 功能重复且设计不合理
**Migration**: 前端切换到新接口

## API Endpoints

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/raw-requirements/:rawRequirementId/collect` | SSE 需求收集 |

### Request Body

```typescript
interface CollectRequirementDto {
  // 文字内容（需求分析师打的字）
  content?: string;
  // 录音文件（base64 或文件 ID）
  audioFile?: {
    type: 'base64' | 'id';
    data: string;
    mimeType?: string;
  };
  // 项目附件 ID 列表
  attachmentIds?: string[];
  // 关联的项目 ID（用于附件关联）
  projectId?: string;
  // AI 配置 ID
  configId?: string;
}
```

### Response Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### SSE Event Format

```
data: {"type":"content","content":"正在分析需求..."}

data: {"type":"content","content":"根据您的描述，系统可以提取以下关键要素："}

data: {"type":"metadata","followUpQuestions":["需求涉及哪些用户角色？","期望的完成时间是？"],"keyElements":["用户登录","权限验证","数据查询"]}

data: {"type":"done"}
```

## 流程图

```
Client                              Service                          AI Chat Service
  |                                    |                                    |
  |--- POST /collect ---------------->|                                    |
  |                                    |                                    |
  |                                    |-- 音频转写 ----------------------->| File Conversion
  |                                    |<---------------------------------|
  |                                    |                                    |
  |                                    |-- 创建/获取对话 ----------------->|
  |                                    |<---------------------------------|
  |                                    |                                    |
  |<-------- SSE stream ---------------|                                    |
  |   {"type":"content",...}           |<--------- SSE chunks -------------|
  |   {"type":"metadata",...}         |                                    |
  |   {"type":"done"}                 |                                    |
  |                                    |                                    |
  |                                    |-- 更新 RawRequirement ------------>|
```

## 错误处理

| 错误码 | 说明 | SSE 响应 |
|--------|------|----------|
| 400 | rawRequirementId 为空 | `{"type":"error","error":"rawRequirementId 不能为空"}` |
| 404 | RawRequirement 不存在 | `{"type":"error","error":"Raw requirement not found"}` |
| 422 | 音频转写失败 | `{"type":"error","error":"音频转写失败: ..."}` |
| 500 | 内部错误 | `{"type":"error","error":"内部错误"}` |
