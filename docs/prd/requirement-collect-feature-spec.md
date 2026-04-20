# 需求收集功能扩展 - 技术规格

## 1. 概述

**目标**：完善需求收集页面的 AI 对话功能，支持文件上传和多格式内容提取。

**核心价值**：用户可以通过上传 PDF、DOCX、音频文件，AI 自动提取内容进行需求分析。

---

## 2. 功能范围

### 2.1 已完成部分（保持不变）
- 需求收集列表页（ProjectCollectionsView）
- 需求收集详情页（RawRequirementCollectView）基本布局
- AI 对话面板（RequirementChatPanel）
- 需求详情面板（RawRequirementMainPanel）
- 需求列表侧边栏（RawRequirementSidebar）
- Store 状态管理（requirementCollect store）

### 2.2 本次新增/完善

| 模块 | 功能 | 优先级 |
|------|------|--------|
| AIChat InputArea | 文件上传组件 | P0 |
| 前端附件 API | 文件上传/删除/列表接口 | P0 |
| 后端文件转换服务 | PDF/DOCX/音频→TXT | P0 |
| 后端 AI Chat | 支持 files 参数传递 | P0 |
| 需求追问历史 | 与后端同步显示 | P1 |
| 需求状态管理 | 完善状态流转 | P1 |

---

## 3. 技术方案

### 3.1 前端 - AIChat InputArea 文件上传

**文件位置**：`packages/ai-chat/src/components/InputArea.vue`

**新增功能**：
1. 文件上传按钮（支持多文件）
2. 文件预览区（输入框上方）
3. 支持文件类型：PDF、DOCX、MP3、WAV、M4A、WMA
4. 文件大小限制：50MB
5. 显示文件名称、大小、删除按钮

**Props 扩展**：
```typescript
interface InputAreaProps {
  // 现有...
  enableFileUpload?: boolean;  // 默认 false
  maxFileSize?: number;        // 默认 50MB
  acceptTypes?: string[];       // 默认 ['.pdf', '.docx', '.mp3', '.wav', '.m4a', '.wma']
  uploadedFiles?: UploadFile[]; // 已上传文件列表
}

interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;  // 预览URL
}
```

**Events 扩展**：
```typescript
emit('file-upload', file: File): void;
emit('file-remove', fileId: string): void;
```

### 3.2 前端 - 附件 API

**文件位置**：`apps/web/src/api/attachment.ts`（新建）

**接口定义**：
```typescript
// 上传附件
POST /api/attachments/upload
Content-Type: multipart/form-data
Body: { file, targetType, targetId?, displayName? }
Response: { id, fileDataId, displayName, originalName, mimeType, size }

// 获取附件列表
GET /api/attachments?targetType=&targetId=&page=&pageSize=
Response: { data: Attachment[], total, page, pageSize }

// 删除附件
DELETE /api/attachments/:id
Response: { code: 0 }

// 批量获取附件
POST /api/attachments/batch
Body: { ids: string[] }
Response: Attachment[]
```

**前端组件**：`apps/web/src/components/common/FileUploader.vue`（新建）

### 3.3 后端 - 文件转换服务

**文件位置**：`apps/service/src/common/services/file-conversion.service.ts`（新建）

**服务职责**：
1. 接收文件 Buffer 和 MIME 类型
2. 根据类型调用对应解析器
3. 返回提取的文本内容

**支持格式**：

| 格式 | MIME 类型 | 解析库 |
|------|----------|--------|
| PDF | application/pdf | pdf-parse |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document | mammoth |
| MP3 | audio/mpeg | — |
| WAV | audio/wav | — |
| M4A | audio/mp4 | — |
| WMA | audio/x-ms-wma | — |

**音频处理**：
- 使用 OpenAI Whisper API（需要配置 OPENAI_API_KEY）
- 支持流式转录
- 备选：ffmpeg + whisper.cpp

**接口定义**：
```typescript
interface FileConversionResult {
  success: boolean;
  text?: string;
  error?: string;
  fileName?: string;
  duration?: number;  // 音频时长（秒）
}

interface ConvertFileDto {
  file: Buffer;
  mimeType: string;
  originalName: string;
}

// Service 方法
async convertFile(dto: ConvertFileDto): Promise<FileConversionResult>
```

### 3.4 后端 - AI Chat 文件支持

**修改文件**：
- `apps/service/src/ai/ai.service.ts`
- `apps/service/src/ai/controllers/ai-chat.controller.ts`

**修改内容**：
1. `SendMessageDto` 添加 `files` 字段
2. 消息发送前，先调用 `FileConversionService` 提取文件内容
3. 将提取的文本附加到消息内容中

```typescript
interface SendMessageDto {
  content: string;
  files?: Array<{
    type: 'text' | 'docx' | 'pdf' | 'audio';
    data: string;  // 文件内容或 URL
    name?: string;
  }>;
}
```

### 3.5 后端 - 原始需求追问同步

**修改文件**：
- `packages/core/src/services/conversation.service.ts`

**功能**：
1. AI 回复时，提取追问问题和关键要素
2. 自动保存到 `RawRequirement` 实体的 `questionAndAnswers` 字段
3. 返回 `followUpQuestions` 和 `keyElements`

---

## 4. 数据模型

### 4.1 新增 Entity

**FileConversionLog**（可选，用于日志记录）
```typescript
interface FileConversionLog {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: 'success' | 'failed';
  textLength: number;
  error?: string;
  duration: number;  // 转换耗时（毫秒）
  createdAt: Date;
}
```

### 4.2 修改 Entity

**RawRequirement** - 添加字段：
```typescript
// packages/core/src/entities/raw-requirement.entity.ts
class RawRequirement {
  clarifiedContent?: string;   // AI 澄清后的内容
  clarifiedAt?: Date;
  questionCount?: number;      // 追问次数
}
```

---

## 5. 用户交互流程

### 5.1 文件上传流程

```
用户点击上传按钮
    ↓
文件选择器打开（限制定类型）
    ↓
文件添加到预览列表（显示上传进度）
    ↓
调用 /api/attachments/upload
    ↓
上传成功 → 显示文件卡片
上传失败 → 显示错误提示
    ↓
用户发送消息时，文件信息随请求发送
```

### 5.2 AI 对话流程（带文件）

```
用户输入消息 + 上传文件
    ↓
前端将文件转为 base64 或发送文件 ID
    ↓
POST /api/ai/chat
Body: { content, files: [{type, data, name}] }
    ↓
后端检测到 files 参数
    ↓
调用 FileConversionService 提取文本
    ↓
将提取内容拼接到 system prompt
    ↓
调用 LLM 生成回复
    ↓
提取追问问题返回给前端
```

---

## 6. 前端页面调整

### 6.1 RequirementChatPanel

```vue
<!-- 组件结构调整 -->
<AIChat>
  <template #header>
    <!-- 保留追问进度 -->
  </template>

  <template #input>
    <InputArea
      :enable-file-upload="true"
      :uploaded-files="uploadedFiles"
      @file-upload="handleFileUpload"
      @file-remove="handleFileRemove"
    />
  </template>
</AIChat>
```

### 6.2 新增 API 文件

**apps/web/src/api/attachment.ts**
```typescript
import api from './axios';
import type { AttachmentTargetType } from '@/types/attachment';

export interface AttachmentResponse {
  id: string;
  fileDataId: string;
  targetType: AttachmentTargetType;
  targetId: string;
  displayName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export const attachmentApi = {
  upload: (formData: FormData) =>
    api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getList: (params: { targetType: string; targetId?: string; page?: number; pageSize?: number }) =>
    api.get('/attachments', { params }),

  delete: (id: string) =>
    api.delete(`/attachments/${id}`),

  batchGet: (ids: string[]) =>
    api.post('/attachments/batch', { ids }),
};
```

---

## 7. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 文件类型不支持 | 提示"仅支持 PDF、DOCX、音频文件" |
| 文件超过大小限制 | 提示"文件大小不能超过 50MB" |
| 文件上传失败 | 显示重试按钮 |
| 文件转换失败 | 显示原文件，提示转换失败原因 |
| 网络断开 | 暂停上传，已上传文件保留 |

---

## 8. 依赖安装

### 后端
```bash
# PDF 解析
npm install pdf-parse

# DOCX 解析
npm install mammoth

# S3 客户端（已有）
# AWS SDK v3
```

### 前端
```bash
# 文件大小格式化
npm install pretty-bytes

# 音频波形显示（可选）
npm install wavesurfer.js
```

---

## 9. 环境变量

### 后端 (.env)
```env
# 文件转换
OPENAI_API_KEY=sk-xxx          # Whisper API 密钥
WHISPER_MODEL=whisper-1        # 可选，默认 whisper-1

# 文件大小限制
MAX_FILE_SIZE=52428800         # 50MB
```

---

## 10. 测试要点

1. **文件上传**
   - 上传 PDF 文件，内容正确提取
   - 上传 DOCX 文件，保留格式
   - 上传音频文件，转录准确

2. **AI 对话**
   - 带文件发送消息
   - 不带文件发送消息
   - 追问历史正确显示

3. **边界情况**
   - 文件类型错误提示
   - 文件过大提示
   - 网络异常处理

---

## 11. 实施计划

### Phase 1：基础功能
1. 后端 FileConversionService 实现
2. AI Chat files 参数支持
3. 前端附件 API 实现
4. InputArea 文件上传组件

### Phase 2：体验优化
1. 上传进度显示
2. 文件预览（图片、PDF）
3. 音频波形显示

### Phase 3：需求深化
1. 追问历史同步
2. 需求澄清流程
3. 需求转换（后续迭代）
