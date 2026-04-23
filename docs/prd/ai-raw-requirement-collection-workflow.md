# AI 原始需求收集工作台（增强版）

## 1. 功能概述

### 1.1 核心价值
为系统分析员和客户提供了一个沉浸式的需求收集环境，通过AI智能追问机制，将模糊的原始需求逐步澄清，最终转化为结构化的需求文档。

### 1.2 关键能力
- **多需求并行管理**：一次会谈可产生多个原始需求
- **智能追问澄清**：AI根据需求内容自动生成追问问题
- **RAG知识关联**：结合现有系统知识，识别需求关联关系
- **独立需求会话**：每个需求可单独深入分析
- **收集生命周期管理**：完整的收集会话开始到结束流程

## 2. 用户场景分析

### 2.1 场景一：初始需求录入

**前置条件**
- 分析员已登录系统
- 已选择项目上下文

**用户流程**
1. 分析员点击"新建收集"或选择已有收集
2. 在主对话区输入客户的原始需求描述
3. AI解析需求内容：
   - 提取关键信息点
   - 识别需求类型（功能/非功能/约束）
   - 判断是否涉及现有系统模块
4. 系统自动：
   - 创建新的RawRequirement记录
   - 关联到当前Collection
   - 返回追问问题（如需要）

**RAG增强行为**
- 分析员输入时，系统异步检索项目历史需求
- 如果发现相似需求，AI在回复中提示：
  ```
  发现相似需求：
  - 需求 #1023: 用户登录功能（相似度 85%）
  - 建议：是否要关联现有需求？
  ```
- 新需求与旧需求的关联关系：
  - 完全相同 → 标记为重复
  - 部分重叠 → 标记为关联并提示冲突风险
  - 全新需求 → 正常创建

**AI追问示例**
用户输入：
```
客户需要存储物品的功能，如果1件以上，每件都是独立入仓单。不同物品存放地不同。
```

AI回复：
```
已理解您的需求。主要包含以下要点：

📦 物品存储
- 客户可存储物品
- 1件以上每件独立入仓单
- 不同物品类型存放在不同区域

💭 为更好理解需求，我有几个问题：

1. **入仓单数量**：如果客户存3件物品，是否产生3张入仓单？
2. **物品分类**：食物、电子产品、酒类如何定义分类标准？
3. **存储区域**：不同物品的存放区域是否可以调整？
```

追问按钮会自动生成，可一键发送。

### 2.2 场景二：独立需求深入分析

**前置条件**
- 已存在至少一条原始需求记录

**用户流程**
1. 分析员点击右侧列表中的某个原始需求卡片
2. 进入该需求的独立会话视图
3. 主聊天区显示该需求的会话历史
4. AI根据会话上下文继续追问
5. 分析员回复追问或补充信息
6. 循环直到AI认为需求已足够清晰（显示完成标记）

**状态转换**
```
pending → processing → clarified → converted/discarded
```

**追问终止条件**
满足以下任一条件，AI认为需求已澄清：
- 追问次数达到上限（默认5轮）
- 关键信息要素已完整收集
- 分析员主动标记为"已澄清"
- AI判断需求信息足够生成结构化描述

**独立会话示例**
```
需求：物品存储功能
会话历史：
[用户] 客户需要存储物品功能...
[AI] 已理解，我有几个问题...
[用户] 每件物品独立入仓单是固定的
[AI] 明白了。请问存储区域如何管理？
[用户] 区域有管理员负责分配
[AI] 好的。最后一个问题：物品存放是否有时效要求？
[用户] 没有，客户可随时取走
[AI] ✅ 需求已澄清，包含以下要点：
- 入仓单：每件物品独立单据
- 区域分配：由管理员负责
- 提取规则：客户随时可取
```

### 2.3 场景三：收集会话管理

**前置条件**
- 存在一个进行中的收集会话

**会话状态**
- **进行中**：分析员可继续添加新需求
- **已完成**：收集会话已关闭，不可添加新需求

**结束收集条件**
必须满足以下所有条件：
- 所有原始需求都已澄清（clarified状态）或已删除
- 分析员主动点击"完成收集"

**分析员操作**
1. 查看本次收集的所有需求列表
2. 检查每个需求的状态
3. 对不需要的需求可选择删除
4. 确认剩余需求都已澄清后点击"完成收集"
5. 系统验证：检查是否还有pending或processing状态的需求
   - 若有剩余未澄清需求，阻止完成并提示
6. 系统提示确认：
   ```
   确定要完成这次收集吗？
   - 收集总数：5 条
   - 已澄清：3 条
   - 待处理：0 条
   
   点击确认后，将无法继续向此收集添加需求。
   ```
7. 完成后可导出收集报告

## 3. 功能需求

### 3.1 收集会话管理

#### 3.1.1 创建收集会话
- 输入：项目ID、收集标题、收集类型（会议/访谈/文档）、收集人
- 输出：RawRequirementCollection实例
- 自动记录：创建时间、收集人信息

#### 3.1.2 切换收集会话
- 支持切换不同项目的收集
- 切换时清空当前会话状态
- 历史收集会话可查看但不可编辑

#### 3.1.3 结束收集会话
- 软删除：将collection状态标记为completed
- 数据保留：所有对话历史和需求记录保留
- 后续不可向已结束的收集添加新需求

### 3.2 需求录入与对话

#### 3.2.1 主对话区功能
- **多行输入**：支持分析员输入长文本
- **Enter发送**：快捷键支持
- **Shift+Enter换行**：保持多行输入习惯
- **发送状态**：显示加载中动画

#### 3.2.2 AI解析与回应
- **实时解析**：用户发送后即时处理
- **结构化提取**：识别关键要素（角色、功能、约束）
- **追问生成**：基于未完整信息生成追问
- **历史关联**：检测与现有需求的相似度

#### 3.2.3 需求自动创建
- 每条用户输入生成一个RawRequirement
- 自动关联到当前Collection
- 初始状态：pending

### 3.3 智能追问系统

#### 3.3.1 追问触发机制
- **主动触发**：AI判断信息不完整时
- **被动触发**：分析员要求继续追问
- **自动触发**：特定关键词触发（如"功能"、"需要"等）

#### 3.3.2 追问策略（LLM自动生成）
- **渐进式**：从核心功能逐步深入
- **场景化**：提供具体场景帮助理解
- **确认式**：对关键信息进行二次确认
- **选项式**：复杂决策提供选项
- **智能生成**：追问问题由LLM根据上下文自动生成，无需模板

#### 3.3.3 追问显示
- **按钮形式**：可一键发送的追问按钮
- **对话流**：追问出现在对话中
- **高亮标识**：追问消息有特殊样式

#### 3.3.4 追问控制
- **追问轮次限制**：默认5轮上限，超出后AI停止追问
- **跳过追问**：分析员可跳过当前追问继续下一个需求
- **补充追问**：分析员可要求AI继续追问
- **手动标记**：分析员可手动标记需求已澄清

#### 3.3.5 追问持久化
- **问题持久化**：AI生成的追问问题必须持久化存储到数据库
- **答案持久化**：分析员的每次回复必须持久化存储
- **会话历史**：完整的问答历史作为需求澄清的证据链
- **独立存储**：每个需求的追问问答独立存储，互不影响

### 3.4 需求关联与分析

#### 3.4.1 RAG知识检索
- **检索范围**：当前模块内的所有历史需求
- **检索方式**：向量相似度匹配
- **阈值设置**：相似度>0.7视为相关
- **结果显示**：在AI回复中显示相关需求

#### 3.4.2 关联类型
- **重复**：完全相同的需求
- **冲突**：逻辑上相互矛盾
- **扩展**：对现有需求的补充
- **依赖**：新需求依赖现有需求

#### 3.4.3 冲突检测
- **实时检测**：输入时异步检测
- **可视化提示**：冲突需求红色高亮
- **处理建议**：AI提供解决建议

### 3.5 需求列表管理

#### 3.5.1 列表展示
- 卡片形式展示每个RawRequirement
- 显示：标题（截取前50字）、状态、追问次数、更新时间
- 颜色标识：状态对应不同颜色

#### 3.5.2 列表操作
- **点击选择**：进入独立会话
- **快速预览**：悬停显示详细信息
- **状态筛选**：按状态过滤
- **搜索**：按内容关键词搜索

#### 3.5.3 批量操作
- **全选**：支持多选
- **批量转换**：将多个需求转换
- **批量删除**：删除不需要的需求

### 3.6 独立需求会话

#### 3.6.1 会话隔离
- 每个需求有独立的会话历史
- 会话历史持久化存储
- 切换需求时加载对应历史

#### 3.6.2 会话续接
- AI可访问该需求的所有历史对话
- 支持跨会话追问延续
- 保持上下文连贯性

#### 3.6.3 会话完成
- AI自动判断或分析员手动标记
- 显示完成标记和摘要
- 支持后续编辑

## 4. 非功能需求

### 4.1 性能要求
- AI响应时间 < 3秒（95分位）
- 列表加载时间 < 1秒
- 搜索响应时间 < 500ms
- 切换需求加载时间 < 800ms

### 4.2 可用性要求
- 支持100个并发用户
- 消息历史支持1000条记录
- 单个收集支持100个需求
- 单个需求支持50轮追问

### 4.3 可靠性要求
- 消息发送失败自动重试3次
- 网络断开时本地缓存消息
- 重新连接后自动同步
- 定期自动保存草稿

### 4.4 安全性要求
- 用户只能访问有权限的项目
- 收集会话与用户账号绑定
- 敏感信息脱敏处理
- 操作日志完整记录

### 4.5 兼容性要求
- 支持Chrome、Firefox、Safari、Edge最新版
- 支持1024x768及以上分辨率
- 移动端支持基本浏览（不推荐编辑）
- 暗色模式适配

## 5. 数据模型

### 5.1 核心实体

```typescript
// 收集会话
RawRequirementCollection {
  id: string
  projectId: string
  title: string
  collectionType: CollectionType
  status: 'active' | 'completed'
  collectedBy: User
  collectedAt: Date
  completedAt?: Date
  meetingMinutes?: string
  createdAt: Date
  updatedAt: Date
}

// 原始需求（追问问答持久化存储）
RawRequirement {
  id: string
  collectionId: string
  originalContent: string           // 原始需求内容
  clarifiedContent?: string         // 澄清后的内容
  status: RawRequirementStatus
  sessionHistory: ChatMessage[]     // 追问问答历史（持久化）
  followUpQuestions: string[]       // 追问问题列表（持久化）
  keyElements: string[]              // 关键要素
  relatedRequirementIds: string[]
  analysisResult?: RequirementAnalysisResult
  createdBy: User
  createdAt: Date
  updatedAt: Date
  clarifiedAt?: Date
  questionCount: number            // 追问轮次计数
}

// 追问问答消息（独立持久化表）
ChatMessage {
  id: string
  rawRequirementId: string         // 关联的需求ID
  role: 'user' | 'assistant'       // user=分析员回复, assistant=AI追问
  content: string                  // 问题或答案内容
  timestamp: Date                  // 发送时间
  sequenceNumber: number           // 消息序号（用于排序）
}

// 需求关联关系
RequirementRelation {
  id: string
  sourceId: string
  targetId: string
  relationType: 'conflict' | 'similar' | 'extends' | 'depends'
  similarity?: number
  description?: string
  createdAt: Date
}
```

### 5.2 枚举定义

```typescript
enum CollectionType {
  MEETING = 'meeting'
  INTERVIEW = 'interview'
  DOCUMENT = 'document'
  OTHER = 'other'
}

enum RawRequirementStatus {
  PENDING = 'pending'      // 待处理
  PROCESSING = 'processing' // 分析中
  CLARIFIED = 'clarified'  // 已澄清
  CONVERTED = 'converted'  // 已转换
  DISCARDED = 'discarded'  // 已丢弃
}

enum RelationType {
  CONFLICT = 'conflict'     // 冲突
  SIMILAR = 'similar'       // 相似
  EXTENDS = 'extends'       // 扩展
  DEPENDS = 'depends'       // 依赖
}
```

## 6. API设计

### 6.1 收集会话API

```typescript
// 创建收集会话
POST /api/ai/collections
Request: {
  projectId: string
  title: string
  collectionType: CollectionType
  meetingMinutes?: string
}
Response: RawRequirementCollection

// 获取收集会话列表
GET /api/ai/collections?projectId={projectId}
Response: RawRequirementCollection[]

// 获取收集会话详情
GET /api/ai/collections/:id
Response: RawRequirementCollectionDetail

// 结束收集会话
POST /api/ai/collections/:id/complete
Response: RawRequirementCollection

// 删除收集会话
DELETE /api/ai/collections/:id
```

### 6.2 需求对话API

```typescript
// 发送消息（新需求）
POST /api/ai/collections/:collectionId/chat
Request: {
  message: string
  source: string
  configId?: string
}
Response: {
  rawRequirementId: string
  assistantMessage: string
  followUpQuestions: string[]
  relatedRequirements?: RelatedRequirement[]
}

// 继续对话（已有需求）
POST /api/ai/raw-requirements/:id/chat
Request: {
  message: string
  configId?: string
}
Response: {
  assistantMessage: string
  followUpQuestions: string[]
  isComplete: boolean
}

// 获取需求会话历史
GET /api/ai/raw-requirements/:id/history
Response: ChatMessage[]

// 标记需求已澄清
POST /api/ai/raw-requirements/:id/clarify
Request: {
  clarifiedContent: string
}
Response: RawRequirement
```

### 6.3 需求关联API

```typescript
// 检索相关需求
POST /api/ai/requirements/related
Request: {
  content: string
  moduleId: string
  limit?: number
}
Response: RelatedRequirement[]

// 创建需求关联
POST /api/ai/requirements/relations
Request: {
  sourceId: string
  targetId: string
  relationType: RelationType
  description?: string
}
Response: RequirementRelation

// 删除需求关联
DELETE /api/ai/requirements/relations/:id
```

### 6.4 需求管理API

```typescript
// 获取收集下的所有需求
GET /api/ai/collections/:collectionId/requirements
Query: {
  status?: RawRequirementStatus
  keyword?: string
  page?: number
  pageSize?: number
}
Response: PaginatedResponse<RawRequirement>

// 添加原始需求
POST /api/ai/collections/:collectionId/requirements
Request: {
  content: string
  source: string
}
Response: RawRequirement

// 更新原始需求
PATCH /api/ai/raw-requirements/:id
Request: {
  clarifiedContent?: string
  status?: RawRequirementStatus
}
Response: RawRequirement

// 删除原始需求
DELETE /api/ai/raw-requirements/:id
```

## 7. 界面设计

### 7.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│ [返回] AI 需求收集工作台                    [新建收集 ▼] [≡]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  当前收集：Q1 需求调研                    状态：进行中  [完成] │
├─────────────────────────────────────┬────────────────────────┤
│                                     │                        │
│  ┌────────────────────────────────┐ │  📋 需求列表 (5)       │
│  │                                │ │  ┌──────────────────┐  │
│  │      AI 对话区                 │ │  │ 物品存储功能     │  │
│  │                                │ │  │ 状态：已澄清     │  │
│  │  👤 客户需要存储物品功能...    │ │  └──────────────────┘  │
│  │                                │ │  ┌──────────────────┐  │
│  │  🤖 已理解，我有几个问题...    │ │  │ 入仓单管理       │  │
│  │      [追问按钮1] [追问按钮2]   │ │  │ 状态：分析中     │  │
│  │                                │ │  └──────────────────┘  │
│  │                                │ │  ┌──────────────────┐  │
│  │                                │ │  │ 存储区域分配     │  │
│  └────────────────────────────────┘ │  │ 状态：待处理     │  │
│                                     │  └──────────────────┘  │
│  ┌────────────────────────────────┐ │                        │
│  │ 输入需求内容...            [发送]│ │  💡 使用提示        │
│  └────────────────────────────────┘ │  - 点击需求进入对话   │
│                                     │  - AI会自动追问      │
├─────────────────────────────────────┴────────────────────────┤
│ [保存草稿] [导出报告]                           [完成收集]   │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 需求独立会话视图

```
┌──────────────────────────────────────────────────────────────┐
│ [返回列表] 需求：物品存储功能              状态：分析中 [✓]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │              会话历史（可滚动）                         │ │
│  │                                                        │ │
│  │  [用户] 客户需要存储物品功能...                        │ │
│  │  [AI] 已理解，请确认以下要点...                        │ │
│  │  [追问] 每件物品是否独立入仓单？                        │ │
│  │  [用户] 是的，每件独立                                 │ │
│  │  [AI] 明白，区域分配规则是？                           │ │
│  │  [追问] 不同物品是否分不同区域？                       │ │
│  │  [用户] 是的，由管理员分配                             │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  💭 建议追问：                                               │
│  - 物品存放是否有时效要求？                                  │
│  - 客户取物品需要什么流程？                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 输入回复内容...                                    [发送]│ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [标记为已澄清] [查看分析结果] [删除需求]                    │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 状态可视化

```
颜色编码：
🟢 待处理（pending）      - 灰色
🟡 分析中（processing）  - 蓝色
🔵 已澄清（clarified）   - 绿色
🔷 已转换（converted）   - 紫色
⚫ 已丢弃（discarded）    - 红色
```

## 8. 实现检查清单

### 8.1 核心功能
- [ ] 创建收集会话
- [ ] 发送消息并创建RawRequirement
- [ ] AI回复与追问生成（LLM自动生成）
- [ ] 追问按钮展示与点击发送
- [ ] **追问问题持久化存储**
- [ ] **追问答案持久化存储**
- [ ] 需求列表展示
- [ ] 点击需求进入独立会话
- [ ] 独立会话历史加载（从持久化存储）
- [ ] 继续追问并保存
- [ ] 追问轮次限制（5轮上限）
- [ ] 标记需求已澄清
- [ ] 结束收集会话（必须所有需求已澄清或已删除）

### 8.2 RAG增强
- [ ] 向量检索相似需求
- [ ] 关联需求展示
- [ ] 冲突检测与提示
- [ ] 相似度计算与阈值过滤

### 8.3 体验优化
- [ ] 加载状态动画
- [ ] 错误提示与重试
- [ ] 空状态引导
- [ ] 快捷键支持
- [ ] 消息草稿保存
- [ ] 离线缓存支持

### 8.4 性能优化
- [ ] 虚拟列表（需求列表）
- [ ] 懒加载会话历史
- [ ] 防抖搜索
- [ ] 并行API请求
- [ ] 前端缓存优化

## 9. 测试用例

### 9.1 正常流程
1. 创建收集 → 输入需求 → AI追问 → 回复追问 → 标记澄清 → 完成收集
2. 创建收集 → 输入需求 → AI追问 → 跳过追问 → 继续下一个需求
3. 创建收集 → 输入需求 → AI未追问 → 直接标记澄清

### 9.2 RAG场景
1. 输入需求 → 检测到相似需求 → 提示关联
2. 输入需求 → 检测到冲突需求 → 提示冲突
3. 输入需求 → 无相似需求 → 正常流程

### 9.3 边界场景
1. 追问达到上限（5轮） → AI停止追问，提示已完成
2. 网络断开 → 本地缓存 → 重连同步
3. 切换需求 → 快速切换 → 正确加载各自历史
4. 删除进行中的需求 → 提示确认
5. 关闭浏览器 → 重新打开 → 恢复会话
6. 尝试结束收集但有未澄清需求 → 阻止并提示
7. 回复内容未保存 → 刷新页面 → 历史丢失（应持久化）

## 10. 风险与注意事项

### 10.1 技术风险
- AI追问质量依赖Prompt设计
- RAG检索准确性依赖向量模型
- 高并发场景下的性能瓶颈

### 10.2 业务风险
- 分析员可能过度依赖AI追问
- 需求澄清标准难以统一
- 多轮追问可能过长

### 10.3 缓解措施
- 定期优化AI Prompt
- 引入人工审核机制
- **追问轮次上限（5轮）**
- 提供需求澄清标准指南
- **追问问答必须持久化存储**
- **结束收集前必须确保所有需求已澄清或删除**
