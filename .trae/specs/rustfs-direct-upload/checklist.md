# Checklist

## 后端实现

- [x] RustFS DTO 定义完整（PresignPutRequestDto、PresignPutResponseDto、PresignGetResponseDto）
- [x] RustFSService 正确配置 S3Client
- [x] RustFSService.getPresignedPutUrl() 实现正确
- [x] RustFSService.getPresignedGetUrl() 实现正确
- [x] RustFSController GET /rustfs/presign-put 接口正确
- [x] RustFSController GET /rustfs/presign-get/:fileDataId 接口正确
- [x] RustFSModule 正确注册
- [x] AppModule 导入 RustFSModule
- [x] ProjectAttachmentController 新增 POST /attachments/create 接口
- [x] 环境变量配置完整

## 前端实现

- [x] useRustFS.ts 正确调用 presign 接口
- [x] useRustFS.ts 实现直传逻辑（fetch PUT）
- [x] useRustFS.ts 实现 createAttachment 逻辑
- [x] 前端环境变量配置 RUSTFS_ENDPOINT

## 功能验证

- [ ] 获取 presigned PUT URL 成功
- [ ] 客户端直传文件到 RustFS 成功
- [ ] fileDataId 正确返回
- [ ] 附件创建接口正常工作
- [ ] 获取 presigned GET URL 成功

## 代码质量

- [x] TypeScript 类型正确
- [x] 错误处理完善
- [x] 日志记录规范
- [x] 单元测试通过
- [ ] Lint 检查通过
