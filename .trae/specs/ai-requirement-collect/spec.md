# AI 增强需求收集工作台规范

## Why

当前 `RawRequirementCollectView.vue` 功能基础，仅支持原始需求的增删改查，无法满足需求分析师的日常工作场景。需求分析师需要一个 AI 增强的工作台，能够：
- 通过多轮对话逐步澄清需求
- 自动生成追问问题引导用户补充信息
- 实时检测与现有需求的冲突
- 可视化展示需求、原始需求、模块之间的关联关系

## What Changes

- 新增 `RequirementCollectView.vue` 需求收集主页面（AI 对话 + 侧边分析）
- 新增 `RequirementCollectSidebar.vue` 右侧需求分析面板组件
- 重构 `RawRequirementCollectView.vue` 为历史记录查看页
- 新增 `RawRequirementCollection` 创建/选择组件
- 新增需求状态和冲突可视化组件
- 后端新增 `RawRequirementCollectionController` 及相关 DTO

## Impact

- Affected specs: 原始需求收集、AI 辅助需求生成、需求关联管理
- Affected code:
  - `apps/web/src/views/RequirementCollectView.vue` - 新增需求收集主页面
  - `apps/web/src/views/RequirementCollectSidebar.vue` - 新增右侧分析面板
  - `apps/web/src/components/requirement/` - 新增相关子组件
  - `apps/service/src/raw-requirement-collection/` - 新增后端控制器和服务
  - `packages/dto/src/` - 新增相关 DTO

## ADDED Requirements

### Requirement: 需求收集工作台布局

系统应提供左右分栏布局的需求收集工作台，左侧为 AI 对话区域，右侧为需求分析展示区域。

#### Scenario: 基础布局
- **GIVEN** 用户进入需求收集页面
- **WHEN** 页面加载完成
- **THEN** 页面分为左右两栏：左侧对话区（60%）、右侧分析区（40%）

#### Scenario: 响应式布局
- **WHEN** 屏幕宽度 < 1024px
- **THEN** 右侧面板自动折叠为可展开的抽屉

### Requirement: 需求收集会话管理

系统应支持创建和管理需求收集会话（RawRequirementCollection）。

#### Scenario: 创建新收集
- **WHEN** 用户点击"新建收集"按钮
- **THEN** 弹出创建对话框，填写：收集标题、收集类型（会议/访谈/文档/其他）
- **AND** 自动关联当前项目

#### Scenario: 切换收集会话
- **WHEN** 用户从下拉列表选择已有收集
- **THEN** 加载该收集下的所有原始需求和对话历史

#### Scenario: 收集列表展示
- **WHEN** 页面头部渲染
- **THEN** 显示当前收集标题 + 类型标签 + 创建时间

#### Scenario: 结束收集
- **WHEN** 用户点击"完成收集"按钮
- **THEN** 系统检查是否所有需求都已澄清或已删除
- **AND** 如果有未澄清需求，阻止完成并提示用户
- **AND** 用户可选择删除不需要的需求
- **AND** 所有需求澄清后可成功结束收集

### Requirement: AI 对话收集模式

系统应支持通过 AI 对话方式收集原始需求。

#### Scenario: 用户输入需求
- **WHEN** 用户在对话框输入自然语言需求
- **AND** 点击发送或按 Enter
- **THEN** 显示用户消息气泡
- **AND** 调用后端 AI 分析接口
- **AND** 问题和答案必须持久化存储

#### Scenario: AI 响应分析
- **WHEN** AI 返回分析结果
- **THEN** 显示 AI 响应气泡，包含：
  - 需求摘要
  - 自动提取的关键词
  - 生成的追问问题（如有）
- **AND** 自动保存为 RawRequirement
- **AND** 追问问题持久化到数据库

#### Scenario: 追问机制
- **WHEN** AI 检测到需求不完整
- **THEN** 在响应中展示追问问题列表
- **AND** 支持用户点击追问自动发送
- **AND** 追问内容由 LLM 自动生成（无需模板）
- **AND** 追问轮次限制为 5 轮

#### Scenario: 多轮对话
- **WHEN** 用户继续输入或点击追问
- **THEN** 保持对话上下文，形成完整的需求收集记录
- **AND** 每次交互都更新 RawRequirement 的 sessionHistory
- **AND** 追问计数 +1，超过 5 轮后 AI 停止追问

### Requirement: 右侧需求分析面板

右侧面板应实时展示当前需求收集的上下文信息。

#### Scenario: 收集摘要
- **WHEN** 面板加载
- **THEN** 顶部显示收集摘要卡片：
  - 收集标题
  - 收集类型
  - 已收集原始需求数量
  - 对话轮次

#### Scenario: 原始需求列表
- **WHEN** 用户已提交需求
- **THEN** 显示原始需求列表卡片
- **AND** 每条需求显示：
  - 需求内容（截取前 100 字）
  - 状态标签（pending/processing/converted/discarded）
  - 创建时间
- **AND** 支持点击展开查看完整内容

#### Scenario: 模块关联
- **WHEN** 用户选择目标模块
- **THEN** 在模块卡片中显示：
  - 模块名称和路径
  - 该模块下的现有需求数量
  - 最近的需求标题列表

#### Scenario: 关联需求分析
- **WHEN** AI 检测到与现有需求的关联
- **THEN** 显示关联需求卡片：
  - 冲突需求（红色）：类型 + 说明 + 建议
  - 相似需求（绿色）：相似度 + 跳转到需求详情
  - 依赖需求（蓝色）：依赖关系说明

### Requirement: 需求状态可视化

系统应清晰展示需求和原始需求的状态。

#### Scenario: RawRequirement 状态
- **WHEN** 渲染原始需求列表项
- **THEN** 根据状态显示不同颜色标签：
  - pending（待处理）：灰色
  - processing（处理中）：蓝色
  - converted（已转换）：绿色
  - discarded（已废弃）：红色

#### Scenario: 冲突级别
- **WHEN** 显示冲突需求
- **THEN** 根据级别显示颜色：
  - critical（严重）：深红
  - high（高）：红色
  - medium（中）：橙色
  - low（低）：黄色

### Requirement: 需求转换确认

系统应支持将收集的原始需求转换为正式需求。

#### Scenario: 生成需求草稿
- **WHEN** 用户点击"生成需求"按钮
- **THEN** 弹出需求生成确认对话框
- **AND** 显示 AI 生成的需求草稿（标题、描述、优先级、验收条件）
- **AND** 允许用户编辑调整

#### Scenario: 确认转换
- **WHEN** 用户确认需求内容
- **AND** 点击"创建需求"按钮
- **THEN** 创建 Requirement 实体
- **AND** 关联当前 RawRequirement
- **AND** 更新 RawRequirement 状态为 converted

## MODIFIED Requirements

### Requirement: RawRequirement 实体扩展

原 `RawRequirement` 实体需要增加字段以支持 AI 对话模式。

| 新增字段 | 类型 | 说明 |
|---------|------|------|
| collectionId | UUID | 关联的需求收集 ID |
| sessionHistory | JSON | 对话历史记录（持久化） |
| followUpQuestions | JSON | 生成的追问问题列表（持久化） |
| keyElements | JSON | 提取的关键词列表 |
| questionCount | INT | 追问轮次计数（默认5轮上限） |
| clarifiedContent | TEXT | 澄清后的内容 |
| clarifiedAt | DATETIME | 澄清时间 |

### Requirement: API 层扩展

新增 `RawRequirementCollectionController` 提供需求收集相关接口：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/collections` | POST | 创建需求收集 |
| `/api/collections` | GET | 获取收集列表 |
| `/api/collections/:id` | GET | 获取收集详情 |
| `/api/collections/:id/raw-requirements` | POST | 添加原始需求（含 AI 分析） |
| `/api/collections/:id/chat` | POST | AI 对话接口 |
| `/api/collections/:id/follow-up-questions` | GET | 获取追问问题 |
| `/api/collections/:id/convert-to-requirement` | POST | 转换为正式需求 |
| `/api/collections/:id/complete` | POST | 结束收集（验证所有需求已澄清） |
| `/api/raw-requirements/:id/chat` | POST | 继续追问（独立会话） |
| `/api/raw-requirements/:id/clarify` | POST | 标记需求已澄清 |
| `/api/raw-requirements/:id` | DELETE | 删除原始需求 |

## REMOVED Requirements

### Requirement: 旧版 RawRequirementCollectView
**Reason**: 功能已被新的需求收集工作台取代
**Migration**: 重构为历史记录查看页面

## Technical Constraints

### 页面路径
- 新页面：`/projects/:projectId/modules/:moduleId/collect`
- 旧页面重定向：`/projects/:projectId/modules/:moduleId/raw-requirements` → 历史记录页

### 组件结构
```
RequirementCollectView.vue
├── RequirementCollectHeader.vue    # 页面头部（收集选择/创建）
├── RequirementCollectChat.vue      # AI 对话区
└── RequirementCollectSidebar.vue   # 右侧分析面板
    ├── CollectionSummary.vue       # 收集摘要
    ├── RawRequirementList.vue      # 原始需求列表
    ├── ModuleInfo.vue              # 模块信息
    └── RelatedRequirements.vue     # 关联需求
```

### AI 对话上下文
```typescript
interface ChatContext {
  projectId: string;
  moduleId: string;
  collectionId: string;
  rawRequirementId?: string;  // 当前正在完善的原始需求
}
```

### 状态管理
- 新增 `useRequirementCollectStore` Pinia store
- 管理当前收集会话、对话历史、原始需求列表、关联分析结果
