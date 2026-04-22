# Tasks

## 后端任务

- [x] Task 1: 创建 RustFS DTO 定义
  - [x] 新增 `packages/dto/src/rustfs/dto/rustfs.dto.ts`
  - [x] 定义 PresignPutRequestDto、PresignPutResponseDto、PresignGetResponseDto
  - [x] 导出到 `packages/dto/src/index.ts`

- [x] Task 2: 创建 RustFSService
  - [x] 新增 `apps/service/src/rustfs/rustfs.service.ts`
  - [x] 实现 S3Client 配置（使用环境变量）
  - [x] 实现 `getPresignedPutUrl()` 方法
  - [x] 实现 `getPresignedGetUrl()` 方法

- [x] Task 3: 创建 RustFSController
  - [x] 新增 `apps/service/src/rustfs/rustfs.controller.ts`
  - [x] 实现 `GET /rustfs/presign-put` 接口
  - [x] 实现 `GET /rustfs/presign-get/:fileDataId` 接口

- [x] Task 4: 创建 RustFSModule
  - [x] 新增 `apps/service/src/rustfs/rustfs.module.ts`
  - [x] 注册 RustFSService 和 S3Client

- [x] Task 5: 修改 AppModule
  - [x] 在 `apps/service/src/app.module.ts` 中导入 RustFSModule

- [x] Task 6: 修改 ProjectAttachmentController
  - [x] 新增 `POST /attachments/create` 接口
  - [x] 支持通过 fileDataId 创建附件关联

- [x] Task 7: 添加环境变量
  - [x] 在 `apps/service/.env.example` 中添加 RUSTFS_* 变量

## 前端任务

- [x] Task 8: 创建 useRustFS Composable
  - [x] 新增 `apps/web/src/composables/useRustFS.ts`
  - [x] 实现 `getPresignedUrl()` 方法
  - [x] 实现 `upload()` 方法（直传到 RustFS）
  - [x] 实现 `createAttachment()` 方法

- [x] Task 9: 更新前端环境变量
  - [x] 在 `apps/web/.env.development` 中添加 RUSTFS_ENDPOINT

## 测试任务

- [x] Task 10: 单元测试
  - [x] 为 RustFSService 编写单元测试

## 依赖关系

- Task 3 依赖 Task 2
- Task 4 依赖 Task 2, Task 3
- Task 5 依赖 Task 4
- Task 6 可独立进行
- Task 8 可独立进行
- Task 10 依赖 Task 2, Task 3, Task 8
