# RustFS 直传功能规格

## Why

现有附件上传采用「前端→后端→RustFS」模式，后端成为性能瓶颈。改为客户端直传可降低后端负载、提升上传速度、改善用户体验。

## What Changes

- 新增 `RustFSController`：提供 presigned URL 生成接口
- 新增 `RustFSService`：封装 S3 presigned URL 逻辑
- 新增前端 `useRustFS.ts`：封装直传逻辑
- 新增 `RustFSModule`：后端模块封装
- 修改 `ProjectAttachmentService`：支持 fileDataId 模式
- 新增 `RustFSModule` 依赖到 `AppModule`

## Impact

- Affected specs: 附件上传流程
- Affected code:
  - `apps/service/src/rustfs/` - 新增
  - `apps/web/src/composables/useRustFS.ts` - 新增
  - `apps/service/src/project-attachment/` - 修改
  - `apps/service/src/app.module.ts` - 修改
  - `packages/dto/src/attachment/` - 新增 DTO

## 技术架构

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Client    │────▶│   Backend     │────▶│  RustFS   │
│  (Browser)  │     │ (Presign URL) │     │  (MinIO)  │
└─────────────┘     └──────────────┘     └───────────┘
     │                     │                    │
     │  1. GET /rustfs/presign-put            │
     │◀────────────────────                    │
     │  2. PUT <presigned_url> (直接上传)     │
     │────────────────────────────────────────▶
     │  3. 返回 fileDataId                    │
     │  4. POST /attachments/create           │
```

## 直传流程

1. 前端调用 `GET /rustfs/presign-put` 获取 presigned PUT URL
2. 前端使用 `fetch(presignedUrl, { method: 'PUT', body: file })` 直接上传
3. 上传成功后，RustFS 返回对象路径作为 `fileDataId`
4. 前端调用 `POST /attachments/create` 关联 fileDataId 与业务数据

## API 接口

### 1. 获取上传 Presigned URL

```
GET /rustfs/presign-put?fileName=xxx&contentType=application/pdf
```

**Request Query:**
- `fileName`: 文件名（必需）
- `contentType`: MIME 类型（必需）

**Response:**
```json
{
  "code": 0,
  "data": {
    "presignedUrl": "http://rustfs:9000/...",
    "fileDataId": "attachments/2025/04/22/uuid_filename.pdf",
    "expiresIn": 3600
  }
}
```

### 2. 获取下载 Presigned URL

```
GET /rustfs/presign-get/:fileDataId
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "presignedUrl": "http://rustfs:9000/...",
    "expiresIn": 3600
  }
}
```

### 3. 创建附件关联（新增）

```
POST /attachments/create
```

**Request Body:**
```json
{
  "fileDataId": "attachments/2025/04/22/uuid_filename.pdf",
  "targetType": "project",
  "targetId": "uuid",
  "displayName": "文档.pdf",
  "description": "可选描述"
}
```

**Response:** `AttachmentResponseDto`

## 环境变量

```env
RUSTFS_ENDPOINT=localhost:9000
RUSTFS_ACCESS_KEY=ReqEqtask
RUSTFS_SECRET_KEY=ReqEqtask/Ewq321#@!.
RUSTFS_BUCKET=req2task
```

## ADDED Requirements

### Requirement: Presigned URL 生成

系统 SHALL 提供 presigned URL 生成接口，用于客户端直传。

#### Scenario: 获取上传 URL
- **WHEN** 客户端请求上传 presigned URL
- **THEN** 后端返回包含 `presignedUrl`、`fileDataId`、`expiresIn` 的响应

#### Scenario: 获取下载 URL
- **WHEN** 客户端请求下载 presigned URL
- **THEN** 后端返回包含 `presignedUrl`、`expiresIn` 的响应

### Requirement: 客户端直传

前端 SHALL 支持通过 presigned URL 直接上传文件到 RustFS。

#### Scenario: 成功上传
- **WHEN** 用户选择文件并上传
- **AND** 调用 presign 接口获取 URL
- **AND** 使用 PUT 方法直接上传到 RustFS
- **THEN** 上传成功并返回 fileDataId
- **AND** 调用附件创建接口关联业务数据

### Requirement: 附件创建接口

系统 SHALL 提供通过 fileDataId 创建附件关联的接口。

#### Scenario: 创建附件关联
- **WHEN** 前端传入有效的 fileDataId 和业务信息
- **THEN** 创建附件记录并返回 AttachmentResponseDto

## MODIFIED Requirements

### Requirement: 附件上传流程

**修改前**：前端→后端→RustFS（后端中转）  
**修改后**：前端→RustFS（直传），后端仅管理元数据
