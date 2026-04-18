# Tasks - AI 增强需求收集工作台

## Phase 1: 后端 DTO 和实体扩展

- [ ] Task 1.1: 在 `packages/dto/src/` 新增需求收集相关 DTO
  - [ ] CreateRawRequirementCollectionDto
  - [ ] RawRequirementCollectionResponseDto
  - [ ] AddRawRequirementDto
  - [ ] ChatMessageDto
  - [ ] FollowUpQuestionDto
  - [ ] RequirementAnalysisDto

- [ ] Task 1.2: 扩展 RawRequirement 实体
  - [ ] 新增 collectionId 字段
  - [ ] 新增 sessionHistory JSON 字段
  - [ ] 新增 followUpQuestions JSON 字段
  - [ ] 新增 keyElements JSON 字段

- [ ] Task 1.3: 新增 RawRequirementCollection 实体
  - [ ] 实现完整实体定义
  - [ ] 添加与 Project、User、RawRequirement 的关联关系

- [ ] Task 1.4: 新增数据库迁移文件
  - [ ] 添加 raw_requirement_collections 表
  - [ ] 修改 raw_requirements 表添加新字段

## Phase 2: 后端服务层

- [ ] Task 2.1: 新增 RawRequirementCollectionService
  - [ ] createCollection() 创建收集
  - [ ] getCollections() 获取列表
  - [ ] getCollectionDetail() 获取详情
  - [ ] addRawRequirement() 添加原始需求

- [ ] Task 2.2: 扩展 RequirementGenerationService
  - [ ] 新增 analyzeWithFollowUp() 带追问的分析
  - [ ] 新增 chatCollect() 需求收集对话

- [ ] Task 2.3: 新增 RawRequirementCollectionController
  - [ ] 实现所有 CRUD 接口
  - [ ] 实现 AI 对话接口

## Phase 3: 前端 Store 和 API

- [ ] Task 3.1: 新增 `stores/requirementCollect.ts` Pinia store
  - [ ] 状态：currentCollection、chatHistory、rawRequirements、analysisResult
  - [ ] actions：createCollection、sendMessage、addRequirement、convertToRequirement

- [ ] Task 3.2: 新增 `api/requirementCollection.ts` API 层
  - [ ] 对应后端所有接口

- [ ] Task 3.3: 在 `api/rawRequirements.ts` 补充新增字段的类型定义

## Phase 4: 前端页面组件

- [ ] Task 4.1: 新增 `views/RequirementCollectView.vue` 主页面
  - [ ] 左右分栏布局
  - [ ] 响应式适配
  - [ ] 路由参数处理

- [ ] Task 4.2: 新增 `components/requirement/RequirementCollectHeader.vue`
  - [ ] 收集选择下拉
  - [ ] 新建收集按钮
  - [ ] 面包屑导航

- [ ] Task 4.3: 新增 `components/requirement/RequirementCollectChat.vue`
  - [ ] 消息气泡列表
  - [ ] 输入框和发送按钮
  - [ ] 追问按钮组
  - [ ] 加载状态

- [ ] Task 4.4: 新增 `components/requirement/RequirementCollectSidebar.vue`
  - [ ] 收集摘要卡片
  - [ ] 原始需求列表
  - [ ] 模块信息卡片
  - [ ] 关联需求分析卡片

- [ ] Task 4.5: 新增 `components/requirement/CollectionSummary.vue`
- [ ] Task 4.6: 新增 `components/requirement/RawRequirementList.vue`
- [ ] Task 4.7: 新增 `components/requirement/RelatedRequirements.vue`
- [ ] Task 4.8: 新增 `components/requirement/ConflictBadge.vue` 冲突标签组件

## Phase 5: 路由和页面重构

- [ ] Task 5.1: 添加新路由
  - [ ] `/projects/:projectId/modules/:moduleId/collect` → RequirementCollectView

- [ ] Task 5.2: 重构 RawRequirementCollectView.vue
  - [ ] 改为历史记录查看页面
  - [ ] 添加说明文字引导使用新页面

## Phase 6: 集成测试

- [ ] Task 6.1: 后端 API 测试
  - [ ] 收集 CRUD 测试
  - [ ] AI 对话接口测试
  - [ ] 追问生成测试

- [ ] Task 6.2: 前端功能测试
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
