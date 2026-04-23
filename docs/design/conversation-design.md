# 需求收集智能追问功能规范

## 1. 概述

为需求收集视图实现智能追问功能，支持 AI 与用户进行多轮对话，自动识别并生成多个 RawRequirement 对象。

### 1.1 核心目标

- 持久化对话内容和追问问答
- 支持识别多个 RawRequirement
- 提示词集中管理于 `packages/core/src/prompts`
- 独立的 Conversation 对象实现松耦合

### 1.2 架构设计

```
┌─────────────────────┐      ┌──────────────────┐
│RawRequirementCollec │──────│   Conversation   │
│        tion         │ 1:1  │                  │
└─────────────────────┘      └────────┬─────────┘
                                       │ 1:N
                              ┌────────▼─────────┐
                              │ConversationMessage│
                              │                  │
                              └──────────────────┘
                                       │
                                       │ N:1
                              ┌────────▼─────────┐
                              │  RawRequirement │
                              │                  │
                              └──────────────────┘
```

## 2. 数据模型

### 2.1 Conversation 实体

```typescript
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'collection_id', type: 'uuid', nullable: true })
  collectionId!: string | null;

  @ManyToOne(() => RawRequirementCollection)
  @JoinColumn({ name: 'collection_id' })
  collection!: RawRequirementCollection | null;

  @Column({ name: 'raw_requirement_id', type: 'uuid', nullable: true })
  rawRequirementId!: string | null;

  @ManyToOne(() => RawRequirement)
  @JoinColumn({ name: 'raw_requirement_id' })
  rawRequirement!: RawRequirement | null;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @Column({ name: 'status', type: 'enum', enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status!: ConversationStatus;

  @OneToMany(() => ConversationMessage, (m) => m.conversation, { cascade: true })
  messages!: ConversationMessage[];

  @Column({ name: 'question_count', type: 'int', default: 0 })
  questionCount!: number;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount!: number;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export enum ConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}
```

### 2.2 ConversationMessage 实体

```typescript
@Entity('conversation_messages')
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ name: 'role', type: 'enum', enum: MessageRole })
  role!: MessageRole;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'raw_requirement_id', type: 'uuid', nullable: true })
  rawRequirementId!: string | null;

  @ManyToOne(() => RawRequirement)
  @JoinColumn({ name: 'raw_requirement_id' })
  relatedRawRequirement!: RawRequirement | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'created_at' })
  createdAt!: Date;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}
```

### 2.3 修改 RawRequirement 实体

移除现有的 `sessionHistory` 和 `followUpQuestions` 字段，改为通过 ConversationId 引用。

```typescript
// 在 RawRequirement 中移除
// @Column({ name: 'session_history', type: 'json', nullable: true })
// sessionHistory!: ChatMessage[] | null;

// @Column({ name: 'follow_up_questions', type: 'json', nullable: true })
// followUpQuestions!: string[] | null;

// 新增字段
@Column({ name: 'conversation_id', type: 'uuid', nullable: true })
conversationId!: string | null;

@ManyToOne(() => Conversation)
@JoinColumn({ name: 'conversation_id' })
conversation!: Conversation | null;
```

### 2.4 修改 RawRequirementCollection 实体

```typescript
// 新增字段
@Column({ name: 'conversation_id', type: 'uuid', nullable: true })
mainConversationId!: string | null;

@ManyToOne(() => Conversation)
@JoinColumn({ name: 'conversation_id' })
mainConversation!: Conversation | null;
```

## 3. 提示词设计

### 3.1 提示词类别

在 `packages/core/src/prompts/prompt.interface.ts` 中新增类别：

```typescript
export type PromptCategory =
  | 'requirement-generation'
  | 'task-breakdown'
  | 'requirement-review'
  | 'user-story-generation'
  | 'quality-assessment'
  | 'conversation'  // 新增
  | 'custom';
```

### 3.2 提示词文件

在 `packages/core/src/prompts/conversation.prompts.ts` 中实现：

#### 3.2.1 智能追问提示词 (INTELLIGENT_FOLLOW_UP)

```typescript
{
  code: 'INTELLIGENT_FOLLOW_UP',
  name: '智能追问',
  category: 'conversation',
  description: '分析用户回答，生成精准追问问题',
  systemPrompt: `你是一个专业的需求分析师。你的任务是根据用户已经提供的信息，分析其中的不完整或模糊之处，生成追问问题。

要求：
1. 每次只生成 1-2 个最关键的追问问题
2. 问题要具体、可回答
3. 优先追问影响范围最大、最核心的问题
4. 如果信息已经足够充分，返回空数组`,
  userPromptTemplate: `原始需求：
{{rawRequirement}}

已收集的需求信息：
{{collectedInfo}}

已完成的追问：
{{previousQuestions}}

请分析以上信息，生成追问问题（最多2个）。
JSON格式：
{
  "questions": [
    {
      "question": "追问问题",
      "reason": "为什么问这个问题",
      "targetAspect": "目标方面"
    }
  ],
  "isComplete": false
}`,
  temperature: 0.7,
  maxTokens: 2000,
  isActive: true,
  parameters: [
    { name: 'rawRequirement', type: 'string', required: true, description: '原始需求' },
    { name: 'collectedInfo', type: 'string', description: '已收集的信息' },
    { name: 'previousQuestions', type: 'string', description: '已完成的追问' },
  ],
}
```

#### 3.2.2 多需求识别提示词 (MULTI_REQUIREMENT_EXTRACTION)

```typescript
{
  code: 'MULTI_REQUIREMENT_EXTRACTION',
  name: '多需求识别',
  category: 'conversation',
  description: '从对话中识别多个独立的原始需求',
  systemPrompt: `你是一个专业的需求分析师。你的任务是从对话内容中识别出多个独立的原始需求。

要求：
1. 将用户的原始需求拆分为多个独立的需求点
2. 每个需求应该是完整的、可独立实现的
3. 标注每个需求的主要类型（功能/性能/安全/接口/数据/体验）
4. 识别需求之间的依赖关系
5. 输出 JSON 格式数组`,
  userPromptTemplate: `对话内容：
{{conversationText}}

原始需求概要：
{{rawRequirementSummary}}

请识别所有独立的原始需求。
JSON格式：
{
  "requirements": [
    {
      "content": "需求内容",
      "type": "功能需求|性能需求|安全需求|接口需求|数据需求|用户体验需求",
      "priority": "高|中|低",
      "dependencies": ["相关需求ID"],
      "keywords": ["关键词1", "关键词2"]
    }
  ]
}`,
  temperature: 0.5,
  maxTokens: 3000,
  isActive: true,
  parameters: [
    { name: 'conversationText', type: 'string', required: true, description: '对话内容' },
    { name: 'rawRequirementSummary', type: 'string', description: '原始需求概要' },
  ],
}
```

#### 3.2.3 对话摘要提示词 (CONVERSATION_SUMMARY)

```typescript
{
  code: 'CONVERSATION_SUMMARY',
  name: '对话摘要',
  category: 'conversation',
  description: '生成对话摘要，用于后续需求分析',
  systemPrompt: `你是一个专业的需求分析师。请根据对话内容生成简洁的摘要。`,
  userPromptTemplate: `对话内容：
{{conversationText}}

请生成一段不超过200字的摘要，包含：
1. 需求的核心内容
2. 已澄清的关键点
3. 仍需关注的模糊点`,
  temperature: 0.3,
  maxTokens: 1000,
  isActive: true,
  parameters: [
    { name: 'conversationText', type: 'string', required: true, description: '对话内容' },
  ],
}
```

## 4. API 设计

### 4.1 Conversation 相关接口

```typescript
// 创建会话
POST /api/conversations
Request: { collectionId?: string; rawRequirementId?: string; title?: string }
Response: Conversation

// 发送消息并获取 AI 回复
POST /api/conversations/:id/messages
Request: { content: string; role: MessageRole }
Response: {
  message: ConversationMessage;
  followUpQuestions: FollowUpQuestion[];
  extractedRequirements?: RawRequirement[];
  isComplete: boolean;
}

// 获取会话消息
GET /api/conversations/:id/messages
Query: { limit?: number; offset?: number }
Response: ConversationMessage[]

// 获取会话列表
GET /api/conversations
Query: { collectionId?: string; rawRequirementId?: string; status?: ConversationStatus }
Response: Conversation[]

// 更新会话状态
PATCH /api/conversations/:id
Request: { status?: ConversationStatus; summary?: string }
Response: Conversation
```

## 5. 前端设计

### 5.1 组件结构

```
RequirementChatPanel.vue
├── ChatHeader.vue (会话标题、状态)
├── ChatMessageList.vue (消息列表)
│   ├── UserMessage.vue
│   ├── AssistantMessage.vue
│   └── SystemMessage.vue
├── ChatInput.vue (输入框)
└── FollowUpQuestionList.vue (追问问题快捷入口)
```

### 5.2 状态管理

```typescript
// stores/conversation.ts
interface ConversationState {
  currentConversation: Conversation | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  followUpQuestions: FollowUpQuestion[];
  isComplete: boolean;
}
```

### 5.3 交互流程

1. 用户进入收集视图 → 创建/加载主 Conversation
2. 用户输入需求 → 保存用户消息，调用 AI
3. AI 回复 → 解析追问问题和识别的需求
4. 显示追问问题 → 用户可点击快速输入
5. 循环对话 → 直到 `isComplete` 或达到追问上限
6. 完成对话 → 更新 Conversation 状态，生成摘要

## 6. 服务层实现

### 6.1 ConversationService

```typescript
@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepo: Repository<Conversation>,
    private readonly messageRepo: Repository<ConversationMessage>,
    private readonly rawRequirementRepo: Repository<RawRequirement>,
    private readonly promptService: PromptService,
    private readonly llmService: LlmService,
  ) {}

  async createConversation(dto: CreateConversationDto): Promise<Conversation>;

  async sendMessage(
    conversationId: string,
    content: string,
    configId?: string
  ): Promise<SendMessageResult>;

  async getConversation(id: string): Promise<Conversation>;

  async getMessages(conversationId: string, options?: PaginationOptions): Promise<ConversationMessage[]>;

  async completeConversation(id: string): Promise<Conversation>;
}
```

### 6.2 智能追问流程

```typescript
async sendMessage(conversationId: string, content: string, configId?: string) {
  const conversation = await this.getConversation(conversationId);

  // 1. 保存用户消息
  const userMessage = await this.saveMessage(conversationId, {
    role: MessageRole.USER,
    content,
  });

  // 2. 收集对话历史
  const history = await this.getMessages(conversationId);
  const historyText = this.formatHistory(history);
  const rawRequirement = await this.getRawRequirement(conversation.rawRequirementId);

  // 3. 调用智能追问提示词
  const followUpResult = await this.promptService.execute('INTELLIGENT_FOLLOW_UP', {
    rawRequirement: rawRequirement.originalContent,
    collectedInfo: historyText,
    previousQuestions: this.formatPreviousQuestions(history),
  });

  // 4. 生成 AI 回复
  const prompt = this.buildChatPrompt(history, rawRequirement);
  const aiResponse = await this.llmService.chat(prompt, configId);

  // 5. 保存 AI 消息
  const assistantMessage = await this.saveMessage(conversationId, {
    role: MessageRole.ASSISTANT,
    content: aiResponse,
    metadata: { followUpQuestions: followUpResult.questions },
  });

  // 6. 检查是否需要识别新需求
  if (followUpResult.questions.length === 0) {
    const extracted = await this.extractRequirements(conversationId);
    return { message: assistantMessage, extractedRequirements: extracted, isComplete: true };
  }

  return {
    message: assistantMessage,
    followUpQuestions: followUpResult.questions,
    isComplete: false,
  };
}
```

## 7. 数据库迁移

### 7.1 新增表

```sql
-- conversations 表
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES raw_requirement_collections(id),
  raw_requirement_id UUID REFERENCES raw_requirements(id),
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  question_count INT DEFAULT 0,
  message_count INT DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- conversation_messages 表
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  raw_requirement_id UUID REFERENCES raw_requirements(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 修改 raw_requirements 表
ALTER TABLE raw_requirements
  DROP COLUMN IF EXISTS session_history,
  DROP COLUMN IF EXISTS follow_up_questions,
  ADD COLUMN conversation_id UUID REFERENCES conversations(id);

-- 修改 raw_requirement_collections 表
ALTER TABLE raw_requirement_collections
  ADD COLUMN main_conversation_id UUID REFERENCES conversations(id);
```

## 8. 测试策略

### 8.1 单元测试

- ConversationService 各方法测试
- PromptService 提示词渲染测试
- 多需求识别逻辑测试

### 8.2 集成测试

- 完整对话流程测试
- 数据库持久化验证
- API 端到端测试

### 8.3 边界测试

- 空对话首次输入
- 追问上限触发
- 多需求拆分验证
- 并发消息处理

## 9. 配置项

```typescript
// 追问配置
export const CONVERSATION_CONFIG = {
  MAX_QUESTION_COUNT: 5,
  MAX_MESSAGES_PER_CONVERSATION: 100,
  SUMMARY_TRIGGER_THRESHOLD: 3,
  AUTO_EXTRACT_THRESHOLD: 2,
};
```
