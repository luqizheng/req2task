# Tasks - AI 增强需求收集工作台

## Phase 1: 后端 DTO 和实体扩展

- [x] Task 1.1: 在 `packages/dto/src/` 新增需求收集相关 DTO
  - [x] CreateRawRequirementCollectionDto
  - [x] RawRequirementCollectionResponseDto
  - [x] AddRawRequirementDto
  - [x] ChatMessageDto
  - [x] FollowUpQuestionDto
  - [x] RequirementAnalysisDto

- [x] Task 1.2: 扩展 RawRequirement 实体
  - [x] 新增 collectionId 字段
  - [x] 新增 sessionHistory JSON 字段
  - [x] 新增 followUpQuestions JSON 字段
  - [x] 新增 keyElements JSON 字段
  - [x] 新增 questionCount 字段
  - [x] 新增 clarifiedContent 字段
  - [x] 新增 clarifiedAt 字段

- [x] Task 1.3: 新增 RawRequirementCollection 实体
  - [x] 实现完整实体定义
  - [x] 添加与 Project、User、RawRequirement 的关联关系
  - [x] 新增 status 字段
  - [x] 新增 completedAt 字段

- [x] Task 1.4: 新增数据库迁移文件
  - [x] 添加 raw_requirement_collections 表新字段
  - [x] 修改 raw_requirements 表添加新字段

## Phase 2: 后端服务层

- [ ] Task 2.1: 新增 RawRequirementCollectionService
  - [ ] createCollection() 创建收集
  - [ ] getCollections() 获取列表
  - [ ] getCollectionDetail() 获取详情
  - [ ] addRawRequirement() 添加原始需求
  - [ ] completeCollection() 结束收集（验证所有需求已澄清）
  - [x] deleteRawRequirement() 删除原始需求
  - [x] clarifyRawRequirement() 标记需求已澄清

- [x] Task 2.2: 扩展 RequirementGenerationService
  - [x] 新增 analyzeWithFollowUp() 带追问的分析
  - [x] 新增 chatCollect() 需求收集对话
  - [x] 追问计数逻辑（5轮上限）

- [x] Task 2.3: 新增 RawRequirementCollectionController
  - [x] 实现所有 CRUD 接口
  - [x] 实现 AI 对话接口
  - [x] 实现追问接口
  - [x] 实现结束收集接口（包含验证逻辑）

## Phase 3: 前端 Store 和 API

- [x] Task 3.1: 新增 `stores/requirementCollect.ts` Pinia store
  - [x] 状态：currentCollection、chatHistory、rawRequirements、analysisResult
  - [x] actions：createCollection、sendMessage、addRequirement、convertToRequirement
  - [x] actions：selectRawRequirement、continueChat、clarifyRequirement
  - [x] actions：completeCollection、deleteRequirement

- [x] Task 3.2: 新增 `api/requirementCollection.ts` API 层
  - [x] 对应后端所有接口
  - [x] 追问相关接口
  - [x] 结束收集接口（带验证）

- [x] Task 3.3: 在 `api/rawRequirements.ts` 补充新增字段的类型定义

## Phase 4: 前端页面组件

- [x] Task 4.1: 新增 `views/RequirementCollectView.vue` 主页面
  - [x] 左右分栏布局
  - [x] 响应式适配
  - [x] 路由参数处理

- [x] Task 4.2: 新增 `components/requirement/RequirementCollectHeader.vue`
  - [x] 收集选择下拉
  - [x] 新建收集按钮
  - [x] 完成收集按钮
  - [x] 结束收集验证

- [x] Task 4.3: 新增 `components/requirement/RequirementCollectChat.vue`
  - [x] 消息气泡列表
  - [x] 输入框和发送按钮
  - [x] 追问按钮组
  - [x] 追问轮次显示
  - [x] 加载状态

- [x] Task 4.4: 新增 `components/requirement/RequirementCollectSidebar.vue`
  - [x] 收集摘要卡片
  - [x] 原始需求列表
  - [x] 模块信息卡片
  - [x] 关联需求分析卡片

- [x] Task 4.5: 新增 `components/requirement/CollectionSummary.vue`
- [x] Task 4.6: 新增 `components/requirement/RawRequirementList.vue`（删除和澄清按钮）
- [x] Task 4.7: 新增 `components/requirement/RelatedRequirements.vue`
- [x] Task 4.8: 新增 `components/requirement/ConflictBadge.vue` 冲突标签组件

## Phase 5: 路由和页面重构

- [x] Task 5.1: 添加新路由
  - [x] `/projects/:projectId/modules/:moduleId/collect` → RequirementCollectView

- [x] Task 5.2: 重构 RawRequirementCollectView.vue
  - [x] 改为历史记录查看页面
  - [x] 添加说明文字引导使用新页面

## Phase 6: 数据库迁移

- [x] Task 6.1: 创建迁移文件
  - [x] 添加 Collection status 和 completedAt 字段
  - [x] 添加 RawRequirement questionCount、clarifiedContent、clarifiedAt 字段

## Phase 7: 集成测试（待实现）

- [ ] Task 7.1: 后端 API 测试
  - [ ] 收集 CRUD 测试
  - [ ] AI 对话接口测试
  - [ ] 追问生成测试

- [ ] Task 7.2: 前端功能测试
  - [ ] 页面加载测试
  - [ ] 对话交互测试
  - [ ] 侧边栏展示测试

## Task Dependencies

```
Phase 1 (后端 DTO/实体)
    ↓
Phase 2 (后端服务层) 依赖 Phase 1
    ↓
Phase 3 (前端 Store/API) 依赖 Phase 2
    ↓
Phase 4 (前端组件) 依赖 Phase 3
    ↓
Phase 5 (路由) 依赖 Phase 4
    ↓
Phase 6 (测试)
```

## 并行任务

Phase 1 中的 Task 1.1 和 Task 1.2 可以并行进行

Phase 4 中的子组件（Task 4.5 - 4.8）可以并行进行
