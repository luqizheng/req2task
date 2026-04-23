# Checklist

## 环境配置
- [x] @aws-sdk/client-s3 已添加到 package.json
- [x] @aws-sdk/lib-storage 已添加到 package.json
- [x] RustFS 环境变量配置完整（MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET）

## DTO 定义
- [x] AttachmentTargetType 枚举已定义 (project, raw_requirement, module, task)
- [x] UploadAttachmentDto 包含 targetType, targetId, file, displayName, description
- [x] AttachmentResponseDto 包含完整附件信息
- [x] AttachmentQueryDto 支持 targetType, targetId, page, pageSize

## 实体定义
- [x] FileData 实体包含所有必需字段
- [x] FileData.fileHash 唯一索引已配置
- [x] ProjectAttachment 实体包含所有必需字段
- [x] ProjectAttachment 与 FileData 的 ManyToOne 关系已配置
- [x] 实体已在 packages/core/src/entities/index.ts 导出

## StorageService
- [x] S3Client 配置支持自定义端点（RustFS）
- [x] upload 方法返回 storagePath
- [x] download 方法返回文件流
- [x] delete 方法正确调用 S3 DeleteObject
- [x] getSignedUrl 方法生成预签名 URL

## ProjectAttachmentService
- [x] upload 方法正确计算 SHA256 哈希
- [x] upload 方法检测重复文件（通过 fileHash 查询）
- [x] upload 方法在新文件时调用 StorageService.upload
- [x] upload 方法创建 ProjectAttachment 记录
- [x] findByTarget 支持分页查询
- [x] batchGet 支持批量查询
- [x] delete 方法检查引用计数
- [x] delete 方法在无引用时删除 FileData 和 S3 文件
- [x] download 方法返回带文件流的附件信息

## Controller
- [x] POST /attachments/upload 上传接口正确
- [x] GET /attachments/:id 获取单条记录
- [x] GET /attachments?targetType=...&targetId=... 列表查询
- [x] POST /attachments/batch 批量获取
- [x] DELETE /attachments/:id 删除
- [x] GET /attachments/:id/download 下载文件
- [x] 所有接口正确使用 JwtAuthGuard
- [x] 所有接口正确使用 CurrentUser 装饰器

## Module
- [x] ProjectAttachmentModule 正确配置
- [x] 模块已在 app.module.ts 导入
- [x] TypeORM 实体已注册

## 数据库迁移
- [x] migration 文件包含 file_data 表
- [x] migration 文件包含 project_attachment 表
- [x] file_data.file_hash 唯一索引已创建
- [x] project_attachment(target_type, target_id) 组合索引已创建
- [ ] 迁移已在本地数据库执行成功

## 测试
- [x] StorageService 单元测试通过
- [x] ProjectAttachmentService 单元测试通过
- [x] 测试覆盖文件去重逻辑
- [x] 测试覆盖多态关联
