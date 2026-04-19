# ProjectAttachment 附件系统规范

## Why
项目需要一个统一的附件管理系统，支持多种实体的文件附件、文件去重存储和统一的存储服务。

## What Changes

### 新增实体
- `FileData`: 存储文件实际数据（SHA256 哈希、文件名、大小、存储路径）
- `ProjectAttachment`: 附件元数据（关联类型、关联ID、创建信息）

### 新增服务
- `StorageService`: RustFS 文件存储服务
- `ProjectAttachmentService`: 附件管理服务

### 新增模块
- `ProjectAttachmentModule`: 附件功能模块

### 新增 DTO
- `UploadAttachmentDto`: 上传请求
- `AttachmentResponseDto`: 附件响应
- `ProjectAttachmentQueryDto`: 查询参数

## Impact
- **影响的包**: `@req2task/core`, `@req2task/service`, `@req2task/dto`
- **外部依赖**: `@aws-sdk/client-s3` (RustFS S3 兼容)

## ADDED Requirements

### Requirement: 多态关联
附件必须支持关联到以下实体：
- `Project` (项目)
- `RawRequirement` (原始需求)
- `FeatureModule` (功能模块)
- `Task` (任务)

#### Scenario: 上传附件到项目
- **WHEN** 用户上传附件并指定 `targetType=project`, `targetId={projectId}`
- **THEN** 附件记录创建成功，与指定项目关联

#### Scenario: 上传附件到需求
- **WHEN** 用户上传附件并指定 `targetType=raw_requirement`, `targetId={requirementId}`
- **THEN** 附件记录创建成功，与指定需求关联

### Requirement: 文件去重
系统必须通过 SHA256 哈希检测重复文件。

#### Scenario: 上传相同内容的文件
- **WHEN** 用户上传一个已存在的文件（相同哈希）
- **THEN** 仅创建新的附件记录，复用现有 FileData，不重复上传

#### Scenario: 上传不同内容的文件
- **WHEN** 用户上传一个不同内容的文件
- **THEN** 创建新的 FileData 记录和附件记录

### Requirement: RustFS 存储
文件必须存储在 RustFS (S3 兼容存储)。

#### Scenario: 上传文件
- **WHEN** 用户上传文件
- **THEN** 文件通过 S3 协议上传到 RustFS，返回存储路径

#### Scenario: 下载文件
- **WHEN** 用户下载附件
- **THEN** 从 RustFS 获取文件流返回

#### Scenario: 删除文件
- **WHEN** 删除附件时无其他引用
- **THEN** 同时删除 FileData 和 RustFS 中的文件

### Requirement: 附件管理 API
系统必须提供完整的 CRUD API。

#### Scenario: 查询项目附件
- **WHEN** 调用 `GET /attachments?targetType=project&targetId={id}`
- **THEN** 返回该项目的所有附件列表

#### Scenario: 批量获取附件
- **WHEN** 调用 `POST /attachments/batch` 传入多个 ID
- **THEN** 返回附件详情列表

## MODIFIED Requirements

### Requirement: 实体关联
`Project`, `RawRequirement`, `FeatureModule`, `Task` 实体需要添加附件关联。

**Migration**: 添加 `OneToMany` 关系到各实体

## REMOVED Requirements
无

## Database Schema

### FileData 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| file_hash | varchar(64) | SHA256 哈希，唯一索引 |
| original_name | varchar(255) | 原始文件名 |
| mime_type | varchar(100) | MIME 类型 |
| size | bigint | 文件大小（字节） |
| storage_path | varchar(500) | RustFS 存储路径 |
| created_at | timestamp | 创建时间 |

### ProjectAttachment 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| file_data_id | uuid | 关联 FileData |
| target_type | enum | 关联类型 (project/raw_requirement/module/task) |
| target_id | uuid | 关联实体 ID |
| display_name | varchar(255) | 显示名称 |
| description | text | 描述 |
| created_by_id | uuid | 创建人 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 索引
- `file_data.file_hash` - 唯一索引（去重查询）
- `project_attachment(target_type, target_id)` - 组合索引（关联查询）

## API Endpoints

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /attachments/upload | 上传附件 |
| GET | /attachments/:id | 获取附件详情 |
| GET | /attachments | 查询附件列表 |
| POST | /attachments/batch | 批量获取附件 |
| DELETE | /attachments/:id | 删除附件 |
| GET | /attachments/:id/download | 下载附件文件 |

## Storage Path Structure
```
attachments/
  {year}/{month}/{day}/
    {uuid}_{original_name}
```
