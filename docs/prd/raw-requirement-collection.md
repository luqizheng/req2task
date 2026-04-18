# 原始需求收集（RawRequirementCollection）PRD

## 1. 概述

### 1.1 背景

在需求分析过程中，客户的需求往往不是一次性确定的，而是经过多轮沟通、逐步澄清和完善的。每次需求变更都可能与之前的需求产生冲突或关联关系。为了更好地管理这个迭代过程，我们需要一个系统来：

- 记录每次需求收集的上下文
- 追踪需求变更历史
- 自动检测需求冲突
- 展示需求间的关联关系

### 1.2 目标

提供一个需求分析工作台，使需求分析师能够在 AI 的辅助下：

- 收集和记录客户原始需求
- 自动检测需求冲突
- 识别需求间的关联关系
- 追踪需求变更历史

## 2. 业务流程

### 2.1 典型场景

**场景：仓库系统需求分析**

**第一次需求收集**
用户（客户）："客户来存物品，如果有 1 件以上，每件都是独立入仓单。不同的物品存放地不同，如食物、电子产品、酒类都是不同地方的。"

系统行为：

1. AI 解析原始需求，生成结构化需求
2. 创建 `RawRequirementCollection`（原始需求收集）
3. 关联生成 `Requirement`（需求）："独立入仓单"
4. 关联生成 `RawRequirement`（原始需求）

**第二次需求收集（需求变更）**
用户（客户）："改一下。如果客户存物品，一个入仓单可以有多个物品。"

系统行为：

1. AI 检测到需求变更
2. 右侧视图展示：
   - 冲突需求（红色）：需求 #01 "独立入仓单" - 逻辑冲突
   - 关联需求（绿色）：需求 #02 "存放地不同" - 功能关联
3. 根据需求状态执行不同操作：
   - 如果需求处于 `processing`/`completed`：记录变更日志，状态不变
   - 如果需求处于 `draft`/`reviewed`/`approved`：状态变更为 `draft`，记录变更日志

## 3. 功能需求

### 3.1 需求收集会话管理

#### 3.1.1 创建需求收集

**输入**

- 项目 ID（必填）
- 收集标题（必填）
- 收集类型（必填）：meeting / interview / document / other
- 收集人（系统自动）

**输出**

- RawRequirementCollection 实例

**业务规则**

- 每个项目可以有多个需求收集
- 收集标题应简洁明了，便于识别

#### 3.1.2 关联原始需求

**输入**

- 收集 ID（必填）
- 原始需求内容（必填）
- 来源信息（必填）：客户姓名、文档名称等

**输出**

- RawRequirement 实例
- RawRequirementCollectionRequirement 关联记录

**业务规则**

- 一条原始需求可以被多个收集引用（多对多关系）
- 原始需求状态：`pending` → `processing` → `converted`/`discarded`
- **一条原始需求可生成多个结构化需求（1:N）**
- **生成需求后，原始需求状态自动变为 `converted`**

### 3.2 AI 需求分析

#### 3.2.1 原始需求解析

**触发时机**

- 用户提交新的原始需求后

**系统行为**

1. 调用 AI 服务解析原始需求
2. 提取关键要素（用户角色、功能需求、非功能需求、约束条件）
3. 识别并拆分为多个独立需求点
4. 生成追问问题（如有需要）
5. 返回结构化分析结果

**输出**

- 需求分析结果列表（JSON）
- 生成的需求 ID 列表
- 追问问题列表

#### 3.2.2 需求变更检测

**触发时机**

- 用户提交与现有需求相关的新需求时

**系统行为**

1. 检索模块内所有相关需求
2. 使用向量搜索找到相似需求
3. AI 分析变更类型：
   - 逻辑冲突（Logical Conflict）
   - 功能关联（Functional Relation）
   - 依赖关系（Dependency）
   - 重复需求（Duplicate）

**输出**

```typescript
interface RequirementChangeAnalysis {
  conflicts: ConflictItem[];
  relatedRequirements: RelatedItem[];
}

interface ConflictItem {
  id: string;
  title: string;
  status: RequirementStatus;
  conflictType: "logical" | "dependency" | "duplicate" | "priority";
  description: string;
  suggestion: string;
}

interface RelatedItem {
  id: string;
  title: string;
  status: RequirementStatus;
  relationType: "similar" | "related" | "blocks" | "required_by";
  similarity: number;
}
```

### 3.3 需求状态处理

#### 3.3.1 冲突需求处理

| 当前状态   | 处理方式                | 状态变更        | 变更日志     |
| ---------- | ----------------------- | --------------- | ------------ |
| draft      | 更新为 draft + 记录日志 | 保持 draft      | 记录变更内容 |
| reviewed   | 更新为 draft + 记录日志 | 保持 reviewed   | 记录变更内容 |
| approved   | 更新为 draft + 记录日志 | 保持 approved   | 记录变更内容 |
| processing | 记录日志                | 保持 processing | 记录变更内容 |
| completed  | 记录日志                | 保持 completed  | 记录变更内容 |
| rejected   | 更新为 draft + 记录日志 | 保持 rejected   | 记录变更内容 |
| cancelled  | 更新为 draft + 记录日志 | 保持 cancelled  | 记录变更内容 |

**业务规则**

- 正在执行的需求（processing/completed）不强制回退状态，但必须记录变更日志
- 未执行的需求（draft/reviewed/approved）状态回退到 draft，确保重新评审

#### 3.3.2 变更日志记录

**记录内容**

- 变更类型：`update`
- 变更字段：`description`、`title` 等
- 旧值与新值
- 变更原因
- 关联的原始需求收集 ID

### 3.4 需求关联展示

#### 3.4.1 冲突展示

**UI 展示**

- 红色边框/背景
- 冲突类型标签（逻辑冲突、依赖冲突等）
- 冲突描述文字
- 建议处理方式

#### 3.4.2 关联展示

**UI 展示**

- 绿色边框/背景
- 关联类型标签（相似需求、依赖需求等）
- 相似度分数
- 跳转到详情链接

## 4. 数据模型

### 4.1 RawRequirementCollection

```typescript
@Entity("raw_requirement_collections")
export class RawRequirementCollection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "project_id" })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column()
  title!: string;

  @Column({
    name: "collection_type",
    type: "enum",
    enum: CollectionType,
  })
  collectionType!: CollectionType;

  @Column({ name: "collected_by_id" })
  collectedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "collected_by_id" })
  collectedBy!: User;

  @Column({ name: "collected_at", type: "datetime" })
  collectedAt!: Date;

  @Column({ name: "meeting_minutes", type: "text", nullable: true })
  meetingMinutes!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => RawRequirementCollectionRequirement, (r) => r.collection)
  rawRequirements!: RawRequirementCollectionRequirement[];
}
```

### 4.2 RawRequirement

```typescript
@Entity("raw_requirements")
export class RawRequirement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "module_id" })
  moduleId!: string;

  @Column({ name: "original_content", type: "text" })
  originalContent!: string;

  @Column({
    type: "enum",
    enum: RawRequirementStatus,
    default: RawRequirementStatus.PENDING,
  })
  status!: RawRequirementStatus;

  @Column({ name: "generated_content", type: "text", nullable: true })
  generatedContent!: string | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;

  @Column({ name: "created_by_id" })
  createdById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by_id" })
  createdBy!: User;

  @Column({ name: "related_raw_requirement_ids", type: "json", nullable: true })
  relatedRawRequirementIds!: string[] | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Requirement, (r) => r.rawRequirement)
  requirements!: Requirement[];
}
```

### 4.3 Requirement（关联更新）

```typescript
@Entity("requirements")
export class Requirement {
  // ... 现有字段 ...

  @Column({ name: "raw_requirement_id", nullable: true })
  rawRequirementId!: string | null;

  @ManyToOne(() => RawRequirement, (r) => r.requirements, { nullable: true })
  @JoinColumn({ name: "raw_requirement_id" })
  rawRequirement!: RawRequirement | null;

  // ... 其他字段 ...
}
```

### 4.4 RawRequirementCollectionRequirement

```typescript
@Entity("raw_requirement_collection_requirements")
export class RawRequirementCollectionRequirement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "collection_id" })
  collectionId!: string;

  @ManyToOne(() => RawRequirementCollection, (c) => c.rawRequirements)
  @JoinColumn({ name: "collection_id" })
  collection!: RawRequirementCollection;

  @Column({ name: "raw_requirement_id" })
  rawRequirementId!: string;

  @ManyToOne(() => RawRequirement)
  @JoinColumn({ name: "raw_requirement_id" })
  rawRequirement!: RawRequirement;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
```

### 4.5 关系说明

```
┌─────────────────────────────────────────────────────────────────┐
│                        关系模型                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RawRequirementCollection (1) ─── (N) RawRequirementCollectionRequirement │
│                                        │                        │
│                                        ▼                        │
│                              RawRequirement (1) ─── (N) Requirement │
│                                                                 │
│  说明：                                                          │
│  - 一个原始需求收集可包含多条原始需求                             │
│  - 一条原始需求可解析生成多个结构化需求（1:N）                   │
│  - 保留关联关系便于追溯需求来源                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 枚举定义

```typescript
// CollectionType 收集类型
export enum CollectionType {
  MEETING = "meeting", // 会议收集
  INTERVIEW = "interview", // 访谈收集
  DOCUMENT = "document", // 文档收集
  OTHER = "other", // 其他
}

// RawRequirementStatus 原始需求状态
export enum RawRequirementStatus {
  PENDING = "pending", // 待处理
  PROCESSING = "processing", // 处理中
  CLARIFIED = "clarified", // 已澄清
  CONVERTED = "converted", // 已转换为需求
  DISCARDED = "discarded", // 已丢弃
}

// RequirementRelationType 需求关系类型
export enum RequirementRelationType {
  CONFLICT = "conflict", // 冲突
  SIMILAR = "similar", // 相似
  RELATED = "related", // 关联
  BLOCKS = "blocks", // 阻塞
  REQUIRED_BY = "required_by", // 被依赖
}

// ConflictType 冲突类型
export enum ConflictType {
  LOGICAL = "logical", // 逻辑冲突
  TEMPORAL = "temporal", // 时序冲突
  FUNCTIONAL = "functional", // 功能冲突
  RESOURCE = "resource", // 资源冲突
  DUPLICATE = "duplicate", // 重复需求
  PRIORITY = "priority", // 优先级冲突
}
```

## 5. API 设计

### 5.1 创建需求收集

```
POST /api/ai/collections
```

**Request**

```typescript
interface CreateCollectionDto {
  projectId: string;
  title: string;
  collectionType: CollectionType;
  collectedAt?: Date;
  meetingMinutes?: string;
}
```

**Response**

```typescript
interface CollectionResponseDto {
  id: string;
  projectId: string;
  title: string;
  collectionType: CollectionType;
  collectedBy: UserSummary;
  collectedAt: Date;
  meetingMinutes?: string;
  rawRequirementCount: number;
  createdAt: Date;
}
```

### 5.2 添加原始需求

```
POST /api/ai/collections/:collectionId/raw-requirements
```

**Request**

```typescript
interface AddRawRequirementDto {
  content: string;
  source: string;
}
```

**Response**

```typescript
interface RawRequirementResponseDto {
  id: string;
  collectionId: string;
  content: string;
  source: string;
  status: RawRequirementStatus;
  generatedRequirementIds?: string[];
  createdAt: Date;
}
```

### 5.3 分析需求变更

```
POST /api/ai/collections/:collectionId/analyze-change
```

**Request**

```typescript
interface AnalyzeChangeDto {
  newRequirementContent: string;
  moduleId: string;
  configId?: string;
}
```

**Response**

```typescript
interface RequirementChangeAnalysisDto {
  newRequirement: {
    id: string;
    content: string;
  };
  conflicts: ConflictAnalysisItem[];
  relatedRequirements: RelatedAnalysisItem[];
  suggestedActions: SuggestedAction[];
}

interface ConflictAnalysisItem {
  requirementId: string;
  requirementTitle: string;
  currentStatus: RequirementStatus;
  conflictType: ConflictType;
  description: string;
  suggestion: string;
  willRevertToDraft: boolean; // 是否会回退到 draft
}

interface RelatedAnalysisItem {
  requirementId: string;
  requirementTitle: string;
  currentStatus: RequirementStatus;
  relationType: RequirementRelationType;
  similarity: number;
}

interface SuggestedAction {
  type: "approve" | "reject" | "modify" | "merge";
  targetRequirementId?: string;
  description: string;
}
```

### 5.4 获取收集列表

```
GET /api/ai/collections
```

**Query Parameters**

- projectId: string（必填）
- page?: number
- pageSize?: number

### 5.5 获取收集详情

```
GET /api/ai/collections/:id
```

**Response**

```typescript
interface CollectionDetailDto {
  id: string;
  projectId: string;
  title: string;
  collectionType: CollectionType;
  collectedBy: UserSummary;
  collectedAt: Date;
  meetingMinutes?: string;
  rawRequirements: RawRequirementWithAnalysis[];
  changeHistory: ChangeHistoryItem[];
  createdAt: Date;
}

interface RawRequirementWithAnalysis extends RawRequirementResponseDto {
  generatedRequirements?: {
    id: string;
    title: string;
    status: RequirementStatus;
  }[];
  analysisResult?: RequirementAnalysisResult;
}

interface RequirementAnalysisResult {
  keyElements: string[];
  functionalPoints: string[];
  constraints: string[];
  followUpQuestions: string[];
}
```

## 6. 界面设计

### 6.1 需求分析工作台

```
┌─────────────────────────────────────────────────────────────────────┐
│  需求收集: 仓库系统 - Q1 需求调研                        [保存] [历史] │
├─────────────────────────────────┬───────────────────────────────────┤
│                                 │                                   │
│     AI 对话区                    │     关联需求分析                   │
│                                 │                                   │
│  ┌─────────────────────────┐   │  ┌─────────────────────────────┐  │
│  │ 用户：客户来存物品...     │   │  │ 冲突检测                    │  │
│  └─────────────────────────┘   │  │                             │  │
│                                 │  │ 🔴 需求 #01                  │  │
│  ┌─────────────────────────┐   │  │ 独立入仓单                   │  │
│  │ AI：分析中...            │   │  │ 类型: 逻辑冲突               │  │
│  └─────────────────────────┘   │  │ 说明: 与新需求"一个入仓单    │  │
│                                 │  │ 可有多个物品"产生冲突        │  │
│  ┌─────────────────────────┐   │  │ 建议: 合并或选择其一         │  │
│  │ 输入:                    │   │  │                             │  │
│  │ [请输入需求...]           │   │  ├─────────────────────────────┤  │
│  │              [发送]      │   │  │ 关联需求                    │  │
│  └─────────────────────────┘   │  │                             │  │
│                                 │  │ 🟢 需求 #02                  │  │
│                                 │  │ 存放地不同                   │  │
│                                 │  │ 关联度: 85%                 │  │
│                                 │  │ 类型: 功能关联               │  │
│                                 │  └─────────────────────────────┘  │
│                                 │                                   │
│                                 │  ┌─────────────────────────────┐  │
│                                 │  │ 原始需求记录                 │  │
│                                 │  │                             │  │
│                                 │  │ • 第一次收集...             │  │
│                                 │  │ • 第二次收集...             │  │
│                                 │  └─────────────────────────────┘  │
└─────────────────────────────────┴───────────────────────────────────┘
```

### 6.2 需求状态指示器

| 状态       | 颜色 | 图标 | 说明     |
| ---------- | ---- | ---- | -------- |
| draft      | 蓝色 | 📝   | 草稿状态 |
| reviewed   | 灰色 | 👁️   | 已评审   |
| approved   | 绿色 | ✅   | 已批准   |
| rejected   | 红色 | ❌   | 已拒绝   |
| processing | 橙色 | 🔄   | 进行中   |
| completed  | 绿色 | 🎉   | 已完成   |
| cancelled  | 灰色 | 🚫   | 已取消   |

### 6.3 冲突级别指示器

| 级别     | 颜色 | 说明             |
| -------- | ---- | ---------------- |
| critical | 深红 | 必须解决才能继续 |
| high     | 红   | 强烈建议解决     |
| medium   | 橙   | 建议关注         |
| low      | 黄   | 可忽略           |

## 7. 核心逻辑

### 7.1 冲突检测算法

```typescript
async detectConflicts(
  newRequirement: string,
  moduleId: string,
  configId?: string
): Promise<ConflictDetectionResult> {
  // 1. 检索模块内所有需求
  const existingRequirements = await this.requirementRepository.find({
    where: { moduleId },
  });

  // 2. 使用向量搜索找到相似需求
  const similarRequirements = await this.vectorStore.search(
    newRequirement,
    10,
    { filter: { moduleId } }
  );

  // 3. AI 分析冲突
  const conflicts = await this.analyzeConflictsWithAI(
    newRequirement,
    similarRequirements,
    configId
  );

  // 4. 返回结果
  return {
    conflicts,
    relatedRequirements: similarRequirements,
    hasConflict: conflicts.length > 0,
  };
}
```

### 7.2 需求状态回退逻辑

```typescript
async handleRequirementChange(
  requirementId: string,
  changeContent: string,
  userId: string
): Promise<RequirementChangeResult> {
  const requirement = await this.requirementRepository.findOne({
    where: { id: requirementId },
  });

  const shouldRevertToDraft = [
    RequirementStatus.DRAFT,
    RequirementStatus.REVIEWED,
    RequirementStatus.APPROVED,
    RequirementStatus.REJECTED,
    RequirementStatus.CANCELLED,
  ].includes(requirement.status);

  // 记录变更日志
  await this.createChangeLog({
    requirementId,
    changeType: ChangeType.UPDATE,
    oldValue: requirement.description,
    newValue: changeContent,
    changedById: userId,
  });

  // 如果需要回退状态
  if (shouldRevertToDraft) {
    await this.requirementRepository.update(requirementId, {
      status: RequirementStatus.DRAFT,
    });
  }

  return {
    requirementId,
    previousStatus: requirement.status,
    currentStatus: shouldRevertToDraft
      ? RequirementStatus.DRAFT
      : requirement.status,
    changeLogged: true,
  };
}
```

## 8. 非功能需求

### 8.1 性能要求

- 冲突检测响应时间：< 3 秒
- 相似需求检索响应时间：< 1 秒
- 列表查询响应时间：< 500ms

### 8.2 可用性要求

- 支持移动端查看（只读）
- 支持深色模式
- 关键操作支持撤销

### 8.3 兼容性要求

- 浏览器：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- API 兼容性：保持 API 版本管理

## 9. 验收标准

### 9.1 功能验收

- [ ] 可以创建需求收集并关联原始需求
- [ ] AI 可以解析原始需求并生成结构化需求
- [ ] 可以检测需求冲突并展示
- [ ] 可以识别需求关联关系
- [ ] 冲突需求根据状态正确处理（回退或保持）
- [ ] 变更日志正确记录
- [ ] **原始需求可关联多个其他原始需求（版本链、相关需求）**
- [ ] **用户可手动添加/移除原始需求关联**
- [ ] **AI 可建议原始需求关联并被用户采纳/拒绝**

### 9.2 界面验收

- [ ] 工作台布局符合设计
- [ ] 冲突展示清晰醒目
- [ ] 关联需求展示友好
- [ ] 支持点击跳转到详情

### 9.3 性能验收

- [ ] 冲突检测 < 3 秒
- [ ] 页面加载 < 1 秒
- [ ] 搜索响应 < 500ms

---

**文档版本**: v1.0  
**最后更新**: 2026-04-17  
**负责人**: req2task 团队
