# Tasks

## 任务清单

### 阶段 1: 基础设施

- [x] Task 1.1: 安装 @aws-sdk/client-s3 依赖
  - 在 `apps/service/package.json` 添加 `@aws-sdk/client-s3`
  - 在 `apps/service/package.json` 添加 `@aws-sdk/lib-storage`

- [x] Task 1.2: 添加环境变量配置
  - 在 `apps/service/.env` 添加 RustFS 相关配置（如未完整）

- [x] Task 1.3: 创建 DTO 定义
  - 创建 `packages/dto/src/attachment.dto.ts`
  - 导出 `UploadAttachmentDto`, `AttachmentResponseDto`, `AttachmentQueryDto`
  - 定义 `AttachmentTargetType` 枚举

### 阶段 2: 实体层

- [x] Task 2.1: 创建 FileData 实体
  - 在 `packages/core/src/entities/` 创建 `file-data.entity.ts`
  - 包含字段：id, fileHash, originalName, mimeType, size, storagePath, createdAt
  - 添加唯一索引在 fileHash

- [x] Task 2.2: 创建 ProjectAttachment 实体
  - 在 `packages/core/src/entities/` 创建 `project-attachment.entity.ts`
  - 包含字段：id, fileDataId, targetType, targetId, displayName, description, createdById, createdAt, updatedAt
  - 多态关联到 FileData

- [x] Task 2.3: 更新实体导出
  - 在 `packages/core/src/entities/index.ts` 导出新实体

### 阶段 3: 服务层

- [x] Task 3.1: 创建 StorageService
  - 在 `apps/service/src/common/services/` 创建 `storage.service.ts`
  - 实现 S3 客户端配置
  - 实现 `upload()` 上传文件
  - 实现 `download()` 下载文件
  - 实现 `delete()` 删除文件
  - 实现 `getSignedUrl()` 获取预签名 URL

- [x] Task 3.2: 创建 ProjectAttachmentService
  - 在 `apps/service/src/` 创建 `project-attachment/` 目录
  - 创建 `project-attachment.service.ts`
  - 实现 `upload()` 上传并去重
  - 实现 `findById()` 获取详情
  - 实现 `findByTarget()` 查询关联附件
  - 实现 `batchGet()` 批量获取
  - 实现 `delete()` 删除（引用计数）
  - 实现 `download()` 下载

### 阶段 4: 模块和控制器

- [x] Task 4.1: 创建 ProjectAttachmentModule
  - 在 `apps/service/src/project-attachment/` 创建 `project-attachment.module.ts`
  - 导入 TypeOrmModule, CommonModule

- [x] Task 4.2: 创建 ProjectAttachmentController
  - 在 `apps/service/src/project-attachment/` 创建 `project-attachment.controller.ts`
  - 实现 `POST /attachments/upload`
  - 实现 `GET /attachments/:id`
  - 实现 `GET /attachments`
  - 实现 `POST /attachments/batch`
  - 实现 `DELETE /attachments/:id`
  - 实现 `GET /attachments/:id/download`

- [x] Task 4.3: 注册模块
  - 在 `apps/service/src/app.module.ts` 导入 `ProjectAttachmentModule`

### 阶段 5: 数据库迁移

- [x] Task 5.1: 生成数据库迁移
  - 运行 `pnpm db:migration:generate` 生成迁移文件
  - 确保包含 file_data 和 project_attachment 表

### 阶段 6: 测试

- [x] Task 6.1: 编写 StorageService 测试
  - mock S3 客户端
  - 测试上传、下载、删除流程

- [x] Task 6.2: 编写 ProjectAttachmentService 测试
  - 测试文件去重逻辑
  - 测试多态关联
  - 测试 CRUD 操作

## 任务依赖

```
Task 1.1 → Task 1.2 → Task 1.3
                       ↓
Task 2.1 → Task 2.2 → Task 2.3
        ↓
Task 3.1 ← Task 1.3, Task 2.3
Task 3.2 ← Task 3.1, Task 2.3
        ↓
Task 4.1 ← Task 3.2
Task 4.2 ← Task 3.2, Task 4.1
Task 4.3 ← Task 4.1, Task 4.2
        ↓
Task 5.1 ← Task 4.3
        ↓
Task 6.1 ← Task 3.1
Task 6.2 ← Task 3.2
```
