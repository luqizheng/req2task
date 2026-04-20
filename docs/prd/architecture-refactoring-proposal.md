# 系统架构解耦改造建议

## 概述

本文档针对当前系统中两个核心子系统的耦合问题提出改造建议：
1. **Conversation 与 AiChat 系统**：实现跨模块的通用 AI 对话能力
2. **评论子系统**：构建可复用的评论基础设施

---

## 一、Conversation 与 AiChat 系统解耦

### 1.1 现状分析

#### 问题识别

| 问题 | 描述 | 影响 |
|------|------|------|
| **服务重复** | 存在 `AIChatService` 和 `ConversationService` 两个服务，功能高度重叠 | 代码维护成本增加 |
| **紧耦合** | AIChatService 直接绑定 `collectionId` 和 `rawRequirementId` | 难以扩展到其他业务模块 |
| **上下文隔离** | 各 AI 服务（RequirementGeneration、ConflictDetection、TaskDecomposition）各自独立 | 无法共享对话历史 |
| **实体绑定过死** | Conversation 只关联 Collection 和 RawRequirement | 新增模块需修改实体 |

#### 当前架构

```
┌──────────────────────────────────────────────────────────────┐
│                      AI Controllers                          │
│  AIChatController / RequirementGenerationController          │
└────────────────────────────┬─────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌─────────────────┐
│ AIChatService  │  │ RequirementGen│  │ConflictDetection│
│   (对话管理)   │  │   Service     │  │    Service      │
└───────┬───────┘  └───────┬───────┘  └────────┬────────┘
        │                  │                    │
        ▼                  │                    │
┌───────────────────────┐  │                    │
│   Conversation        │◄─┼────────────────────┘
│ (collectionId,        │  │ 各自创建/使用会话
│  rawRequirementId)    │  │
└───────────────────────┘  │
                          │
        ┌─────────────────┘
        ▼
┌───────────────────────┐
│   LLMService           │
└───────────────────────┘
```

### 1.2 改造方案

#### 核心思路

1. **职责反转**：Conversation 完全独立，不存储任何业务关联
2. **业务实体自决**：业务对象（如 Requirement）自行持有 `conversationId`
3. **服务透明**：AIConversationService 只负责对话管理，业务逻辑由使用方决定
4. **单向链表关联**：支持多个 Conversation 顺序关联（如需求评审对话链）

#### 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Entities                         │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Requirement   │  │      Task       │  │   Project   │ │
│  │  ┌───────────┐  │  │  ┌───────────┐  │  │             │ │
│  │  │convId     │  │  │  │convId    │  │  │  (可选)     │ │
│  │  │nextConvId │  │  │  │nextConvId│  │  │             │ │
│  │  └─────┬─────┘  │  │  └─────┬─────┘  │  └─────────────┘ │
│  └────────┼────────┘  └────────┼────────┘                   │
└───────────┼────────────────────┼────────────────────────────┘
            │                    │
            │ 持有 conversationId │ 持有 conversationId
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       Conversation                          │
│  (完全独立，不知道被谁使用)                                  │
│                                                              │
│  id / title / status / messages[] / messageCount / metadata │
│                                                              │
│  ┌───────────────┐  ┌───────────────────────────────────┐  │
│  │    链表指针    │  │          业务元数据                 │  │
│  │  nextConvId   │  │  metadata: { mode, capability }   │  │
│  └───────────────┘  └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  AIConversationService                       │
│  createSession() / sendMessage() / streamMessage()           │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 实体改造

#### 改造后的 Conversation 实体（核心独立）

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 链表指针 - 支持对话链（如：初稿评审 → 修改评审 → 终审）
  @Column({ name: 'next_conversation_id', type: 'uuid', nullable: true })
  nextConversationId!: string | null;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  // 对话类型（由业务决定含义）
  @Column({ name: 'conversation_type', type: 'varchar', length: 50, default: 'general' })
  conversationType!: string;

  @OneToMany(() => ConversationMessage, (m) => m.conversation, { cascade: true })
  messages!: ConversationMessage[];

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount!: number;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary!: string | null;

  // 业务元数据 - 存储业务关心的信息，不影响核心逻辑
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

#### 业务实体改造示例（Requirement）

```typescript
@Entity('requirements')
export class Requirement {
  // ... 其他字段

  // 对话关联 - 由 Requirement 自己决定
  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;

  // 评审链 - 需求可能经历多次评审
  @Column({ name: 'review_chain_id', type: 'uuid', nullable: true })
  reviewChainId!: string | null;
}
```

#### 业务实体改造示例（RawRequirement）

```typescript
@Entity('raw_requirements')
export class RawRequirement {
  // ... 其他字段

  // 需求澄清对话
  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;
}
```

#### 业务实体改造示例（Task）

```typescript
@Entity('tasks')
export class Task {
  // ... 其他字段

  // 开发讨论对话
  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId!: string | null;

  @ManyToOne(() => Conversation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation | null;
}
```

### 1.4 服务层改造

#### AIConversationService（核心独立服务）

```typescript
@Injectable()
export class AIConversationService {
  constructor(
    private readonly conversationRepo: Repository<Conversation>,
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly llmService: LLMService,
    private readonly fileParser: FileParserService,
  ) {}

  // 创建对话
  async createSession(): Promise<Conversation>;

  // 获取对话
  async getSession(sessionId: string): Promise<Conversation | null>;

  // 发送消息
  async sendMessage(
    sessionId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): Promise<ChatResult>;

  // 流式消息
  streamMessage(
    sessionId: string,
    dto: SendMessageDto,
    configId?: string,
    systemPrompt?: string,
  ): AsyncGenerator<StreamChunk>;
}
```

#### 业务层使用示例（RequirementService）

```typescript
@Injectable()
export class RequirementService {
  constructor(
    private readonly requirementRepo: Repository<Requirement>,
    private readonly aiConversationService: AIConversationService,
  ) {}

  // 需求评审对话
  async startReviewConversation(requirementId: string): Promise<Conversation> {
    const requirement = await this.requirementRepo.findOne({ where: { id: requirementId } });

    // 业务逻辑自行决定如何关联 Conversation
    const conversation = await this.aiConversationService.createSession();

    // 创建评审链（如果已有对话，新对话续上）
    if (requirement.conversationId) {
      const oldConversation = await this.aiConversationService.getSession(requirement.conversationId);
      if (oldConversation) {
        // 链表追加
        oldConversation.nextConversationId = conversation.id;
        await this.aiConversationService.updateSession(oldConversation);
      }
    }

    requirement.conversationId = conversation.id;
    await this.requirementRepo.save(requirement);

    return conversation;
  }

  // 发送评审消息
  async sendReviewMessage(
    requirementId: string,
    dto: SendMessageDto,
  ): Promise<ChatResult> {
    const requirement = await this.requirementRepo.findOne({ where: { id: requirementId } });

    if (!requirement.conversationId) {
      throw new BadRequestException('请先开启评审对话');
    }

    return this.aiConversationService.sendMessage(
      requirement.conversationId,
      dto,
    );
  }
}
```

### 1.5 对比：两种关联模式

| 维度 | 多态关联（targetType+targetId） | 业务持有 conversationId |
|------|--------------------------------|--------------------------|
| **耦合度** | Conversation 知道业务类型 | Conversation 完全独立 |
| **扩展性** | 新增类型需改枚举 | 无需修改 Conversation |
| **灵活性** | 一对一关系 | 一对一 + 链表链式 |
| **查询** | 需要索引 + 类型过滤 | 直接 ID 查询 |
| **业务语义** | 隐式关联 | 显式关联 |

### 1.6 迁移策略

| 阶段 | 内容 | 影响 |
|------|------|------|
| **Phase 1** | 移除 Conversation 的 `collectionId` + `rawRequirementId` | 低 |
| **Phase 2** | 业务实体添加 `conversationId` 字段 | 中 |
| **Phase 3** | 迁移旧数据到 `raw_requirement.conversation_id` | 中 |
| **Phase 4** | 删除旧的服务重复代码 | 低 |

---

## 二、评论子系统设计

### 2.1 现状分析

#### 问题识别

| 问题 | 描述 | 影响 |
|------|------|------|
| **无通用评论** | 只有 `RequirementChangeLog.comment` 简单字段 | 无法支持复杂评论交互 |
| **JSON 存储** | `RawRequirement.questionAndAnswers` 使用 JSON 数组 | 查询效率低，无法建索引 |
| **无嵌套回复** | 缺少评论回复树结构 | 无法支持讨论线程 |
| **功能分散** | 各模块自行实现评论相关逻辑 | 代码重复 |

### 2.2 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Commentable Entities                   │
│  Requirement / Task / Project / RawRequirement / etc.      │
└────────────────────────────┬────────────────────────────────┘
                             │ 1:N (targetType + targetId)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Comment (核心实体)                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ id, targetType, targetId, parentId, content,         │  │
│  │ authorId, mentionUsers, replyCount, likeCount,       │  │
│  │ status, createdAt, updatedAt                         │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    CommentReaction ( Reactions)            │
│  userId, commentId, reactionType (emoji/type)              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 实体设计

#### Comment 实体

```typescript
@Entity('comments')
@Index(['targetType', 'targetId'])
@Index(['authorId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'target_type',
    type: 'enum',
    enum: CommentTargetType,
  })
  targetType!: CommentTargetType;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Comment | null;

  @OneToMany(() => Comment, (c) => c.parent)
  replies!: Comment[];

  @Column({ name: 'root_id', type: 'uuid', nullable: true })
  rootId!: string | null;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'content_html', type: 'text', nullable: true })
  contentHtml!: string | null;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'mention_users', type: 'json', nullable: true })
  mentionUsers!: string[] | null;

  @Column({ name: 'reply_count', type: 'int', default: 0 })
  replyCount!: number;

  @Column({ name: 'like_count', type: 'int', default: 0 })
  likeCount!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.ACTIVE,
  })
  status!: CommentStatus;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

export enum CommentTargetType {
  REQUIREMENT = 'requirement',
  TASK = 'task',
  PROJECT = 'project',
  RAW_REQUIREMENT = 'raw_requirement',
  COLLECTION = 'collection',
}
```

#### CommentReaction 实体

```typescript
@Entity('comment_reactions')
@Index(['commentId', 'userId'], { unique: true })
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'comment_id', type: 'uuid' })
  commentId!: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment!: Comment;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'reaction_type',
    type: 'enum',
    enum: ReactionType,
  })
  reactionType!: ReactionType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  THINK = 'think',
}
```

### 2.4 服务层设计

#### CommentService

```typescript
@Injectable()
export class CommentService {
  // 创建评论
  async create(dto: CreateCommentDto, authorId: string): Promise<Comment>;
  
  // 回复评论
  async reply(parentId: string, dto: CreateCommentDto, authorId: string): Promise<Comment>;
  
  // 获取评论列表（支持嵌套）
  async getComments(options: CommentListOptions): Promise<CommentTree>;
  
  // 更新评论
  async update(id: string, dto: UpdateCommentDto, userId: string): Promise<Comment>;
  
  // 删除评论（软删除）
  async delete(id: string, userId: string): Promise<void>;
  
  // 点赞/取消点赞
  async toggleReaction(commentId: string, userId: string, type: ReactionType): Promise<boolean>;
  
  // @提及解析
  parseMentions(content: string): string[];
  
  // 内容渲染（支持 Markdown）
  renderContent(content: string): string;
}
```

### 2.5 API 设计

| 接口 | 方法 | 功能 |
|------|------|------|
| `/comments` | POST | 创建评论 |
| `/comments/:id/replies` | POST | 回复评论 |
| `/comments` | GET | 获取评论列表 |
| `/comments/:id` | GET | 获取评论详情 |
| `/comments/:id` | PUT | 更新评论 |
| `/comments/:id` | DELETE | 删除评论 |
| `/comments/:id/reactions` | POST | 添加反应 |
| `/comments/:id/reactions` | DELETE | 移除反应 |

### 2.6 迁移策略

| 阶段 | 内容 | 涉及模块 |
|------|------|----------|
| **Phase 1** | 创建 Comment 实体和服务 | 新增 comment 模块 |
| **Phase 2** | 迁移 `RequirementChangeLog.comment` | requirements 模块 |
| **Phase 3** | 迁移 `RawRequirement.questionAndAnswers` | raw-requirement 模块 |
| **Phase 4** | 新增评论 UI 组件 | web 前端 |

---

## 三、实施优先级与风险

### 3.1 优先级建议

| 优先级 | 任务 | 理由 |
|--------|------|------|
| **P0** | Conversation 多态关联改造 | 是其他改造的基础 |
| **P1** | Comment 实体和服务 | 评论是高频功能需求 |
| **P2** | AI 服务层抽象 | 提升代码复用性 |
| **P3** | 旧数据迁移 | 技术债务清理 |

### 3.2 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据迁移失败 | 高 | 分阶段迁移，保留回滚能力 |
| API 兼容性破坏 | 中 | 保持旧端点兼容，逐步废弃 |
| 性能下降 | 中 | 添加必要索引，监控查询性能 |
| 依赖关系复杂 | 低 | 清晰的任务拆解和测试覆盖 |

### 3.3 预期收益

| 收益 | 量化指标 |
|------|----------|
| 代码复用率提升 | AI 相关代码重复减少 60% |
| 新增业务模块接入 AI 成本 | 从 2 周降至 2 天 |
| 评论功能开发时间 | 从 1 周降至 1 天 |
| 系统可维护性 | 代码行数减少，模块边界清晰 |

---

## 四、附录

### 4.1 相关文档

- [AI 辅助需求分析设计](../design/ai/ai-assistant-design.md)
- [对话设计](../design/conversation-design.md)
- [数据库设计](../design/database-design.md)

### 4.2 讨论要点

- [ ] 是否需要支持评论的编辑历史？
- [ ] AI 对话是否需要支持"追问模式"和"任务模式"两种类型？
- [ ] 评论是否需要支持富文本编辑器？

---

## 五、实现状态

### 5.1 已完成

| 功能 | 状态 | 文件 |
|------|------|------|
| Conversation 实体改造 | ✅ 完成 | `conversation.entity.ts` |
| Requirement 实体添加 conversationId | ✅ 完成 | `requirement.entity.ts` |
| Task 实体添加 conversationId | ✅ 完成 | `task.entity.ts` |
| AIConversationService | ✅ 完成 | `ai-conversation.service.ts` |
| AIConversationController | ✅ 完成 | `ai-conversation.controller.ts` |
| 数据库迁移文件 | ✅ 完成 | `1745080000000-AddConversationIdToEntities.ts` |

### 5.2 待完成

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 业务层集成示例 | P1 | RequirementService/TaskService 集成示例 |
| 清理旧字段 | P2 | 移除 Conversation 的 collectionId/rawRequirementId |
| 评论子系统 | P2 | 见第二部分设计 |

### 5.3 API 端点

```
POST   /ai/conversations                    - 创建会话
GET    /ai/conversations/:id                - 获取会话信息
GET    /ai/conversations/:id/messages      - 获取消息列表
POST   /ai/conversations/:id/messages      - 发送消息
SSE    /ai/conversations/:id/stream        - 流式消息
DELETE /ai/conversations/:id                - 清空会话
POST   /ai/conversations/:id/archive       - 归档会话
POST   /ai/conversations/:id/link/:nextId  - 链接下一会话
```

### 5.4 运行迁移

```bash
pnpm db:migration:run
```
