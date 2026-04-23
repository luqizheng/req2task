# Checklist

## 实现检查清单

### DTO 定义
- [x] `CollectRequirementDto` 接口定义正确
- [x] 包含 `content` 文字字段
- [x] 包含 `audioFile` 录音字段
- [x] 包含 `attachmentIds` 附件列表字段
- [x] 包含 `projectId` 项目关联字段
- [x] 包含 `configId` AI 配置字段
- [x] DTO 在 `packages/dto/src/index.ts` 导出

### 服务层
- [x] `RequirementCollectService` 创建成功
- [x] `collect()` 方法正确处理请求
- [x] 音频转写调用 `FileConversionService`
- [x] SSE 响应格式正确
- [x] 错误处理完整
- [x] 附件关联逻辑正确

### 控制器
- [x] 删除 `chatCollect` 方法
- [x] 删除 `streamChatCollect` 方法
- [x] 新增 `collect` SSE 接口
- [x] 路由路径正确 `:rawRequirementId/collect`
- [x] HTTP 方法为 POST

### SSE 响应格式
- [x] `Content-Type: text/event-stream` 设置正确
- [x] `Cache-Control: no-cache` 设置正确
- [x] `Connection: keep-alive` 设置正确
- [x] `X-Accel-Buffering: no` 设置正确
- [x] content 类型事件格式正确
- [x] metadata 类型事件格式正确
- [x] done 类型事件格式正确
- [x] error 类型事件格式正确

### 依赖注入
- [x] `HttpModule` 已导入
- [x] `RequirementCollectService` 已注册
- [x] 依赖关系正确

### 测试
- [x] 纯文字收集测试通过
- [x] 带音频收集测试通过
- [x] 带附件收集测试通过
- [x] 错误场景测试通过
