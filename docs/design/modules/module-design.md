---
last_updated: 2024-02-01
status: active
owner: req2task团队
---

# 模块详细设计

## 1. 整体架构

### 1.1 模块组织

```
apps/service/src/
├── app.module.ts
│
├── shared/                          # 共享模块
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── dto/                         # 共享 DTO
│   └── interfaces/
│
├── modules/                         # 功能模块（按业务划分）
│   ├── auth/                        # 认证模块
│   ├── users/                       # 用户模块
│   ├── projects/                    # 项目管理
│   ├── feature-modules/              # 功能模块
│   ├── requirements/                # 需求管理
│   ├── user-stories/                # 用户故事
│   ├── acceptance-criteria/         # 验收条件
│   ├── tasks/                       # 任务管理
│   ├── raw-requirements/            # 原始需求
│   ├── llm/                         # LLM 管理
│   ├── ai/                          # AI 能力
│   └── notifications/               # 通知模块
│
└── infrastructure/                  # 基础设施
    ├── database/
    ├── redis/
    ├── chroma/
    └── llm-providers/
```

### 1.2 模块依赖关系

```
           ┌─────────┐
           │  Auth   │
           └────┬────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Users  │  │Projects │  │  LLM   │
└────────┘  └────┬───┘  └────┬───┘
                  │           │
         ┌────────┼───────────┤
         │        │           │
         ▼        ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │FeatureM │ │  AI   │ │  AI   │
    │ odules  │ │ Search│ │Generate│
    └────┬────┘ └────────┘ └────────┘
         │
         ▼
    ┌────────────────┐
    │  Requirements  │
    └───────┬────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌────────┐ ┌──────┐ ┌────────┐
│UserStor│ │Tasks │ │RawReq  │
└────────┘ └──┬───┘ └────────┘
              │
              ▼
         ┌────────┐
         │SubTasks│
         └────────┘
```

---

## 2. 项目管理模块 (Projects)

### 2.1 目录结构

```
modules/projects/
├── dto/
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   ├── add-member.dto.ts
│   └── index.ts
├── entities/
│   └── project.entity.ts
├── services/
│   ├── projects.service.ts
│   └── projects.service.spec.ts
├── controllers/
│   └── projects.controller.ts
├── projects.module.ts
└── projects.constants.ts
```

### 2.2 实体定义

```typescript
// entities/project.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ name: 'estimated_man_days', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedManDays: number;

  @Column({ name: 'budget_man_days', type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetManDays: number;

  @Column({ name: 'actual_man_days', type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualManDays: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToMany(() => FeatureModule, (module) => module.project)
  modules: FeatureModule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

---

## 3. 需求管理模块 (Requirements)

### 3.1 实体定义

```typescript
// entities/requirement.entity.ts
export enum RequirementPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RequirementSource {
  MANUAL = 'manual',
  AI_GENERATED = 'ai_generated',
  DOCUMENT_IMPORT = 'document_import',
}

export enum RequirementStatus {
  DRAFT = 'draft',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id' })
  moduleId: string;

  @ManyToOne(() => FeatureModule, (module) => module.requirements)
  @JoinColumn({ name: 'module_id' })
  module: FeatureModule;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: RequirementPriority,
  })
  priority: RequirementPriority;

  @Column({
    type: 'enum',
    enum: RequirementSource,
  })
  source: RequirementSource;

  @Column({
    type: 'enum',
    enum: RequirementStatus,
    default: RequirementStatus.DRAFT,
  })
  status: RequirementStatus;

  @Column({
    name: 'story_points',
    type: 'integer',
    default: 0,
  })
  storyPoints: number;

  @Column({ name: 'parent_requirement_id', nullable: true })
  parentRequirementId: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => UserStory, (us) => us.requirement)
  userStories: UserStory[];

  @OneToMany(() => Task, (task) => task.requirement)
  tasks: Task[];

  @OneToMany(() => RequirementChangeLog, (log) => log.requirement)
  changeLogs: RequirementChangeLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

### 3.2 状态机服务

```typescript
// services/requirement-state.service.ts
@Injectable()
export class RequirementStateService {
  private readonly transitions: Map<RequirementStatus, RequirementStatus[]> = new Map([
    [RequirementStatus.DRAFT, [RequirementStatus.REVIEWED]],
    [RequirementStatus.REVIEWED, [RequirementStatus.APPROVED, RequirementStatus.REJECTED]],
    [RequirementStatus.APPROVED, [RequirementStatus.PROCESSING]],
    [RequirementStatus.PROCESSING, [RequirementStatus.COMPLETED, RequirementStatus.APPROVED]],
    [RequirementStatus.REJECTED, [RequirementStatus.DRAFT, RequirementStatus.CANCELLED]],
    [RequirementStatus.COMPLETED, [RequirementStatus.PROCESSING]],
    [RequirementStatus.CANCELLED, []],
  ]);

  canTransition(from: RequirementStatus, to: RequirementStatus): boolean {
    const allowed = this.transitions.get(from) || [];
    return allowed.includes(to);
  }

  getNextStatuses(current: RequirementStatus): RequirementStatus[] {
    return this.transitions.get(current) || [];
  }
}
```

---

## 4. 任务管理模块 (Tasks)

### 4.1 实体定义

```typescript
// entities/task.entity.ts
export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  DEPLOYMENT = 'deployment',
  OTHER = 'other',
}

export enum AssigneeType {
  HUMAN = 'human',
  AI_AGENT = 'ai_agent',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_number', length: 30, unique: true })
  taskNumber: string;

  @Column({ name: 'requirement_id' })
  requirementId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskPriority })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskType })
  type: TaskType;

  @Column({ name: 'assignee_type', type: 'enum', enum: AssigneeType })
  assigneeType: AssigneeType;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;

  @Column({ name: 'estimated_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ name: 'actual_hours', type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualHours: number;

  @Column({ name: 'is_wasted', type: 'boolean', default: false })
  isWasted: boolean;

  @Column({ name: 'cancelled_reason', length: 500, nullable: true })
  cancelledReason: string;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'parent_task_id', nullable: true })
  parentTaskId: string;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @OneToMany(() => TaskDependency, (dep) => dep.dependentTask)
  prerequisiteDependencies: TaskDependency[];

  @OneToMany(() => TaskDependency, (dep) => dep.prerequisiteTask)
  dependentDependencies: TaskDependency[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

---

## 5. AI 模块 (LLM & AI)

### 5.1 LLM Provider 接口

```typescript
// providers/llm-provider.interface.ts
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;
  readonly provider: LLMProviderType;

  call(messages: LLMMessage[], options?: CallOptions): Promise<LLMResponse>;
  validateConfig(): Promise<boolean>;
}

export interface CallOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}

export enum LLMProviderType {
  DEEPSEEK = 'deepseek',
  OPENAI = 'openai',
  OLLAMA = 'ollama',
  MINIMAX = 'minimax',
}
```

---

## 6. 前端模块组织

### 6.1 Vue 项目结构

```
apps/web/src/
├── api/                           # API 调用
│   ├── client.ts                  # Axios 实例
│   ├── projects.ts
│   ├── requirements.ts
│   ├── tasks.ts
│   └── ai.ts
│
├── stores/                        # Pinia 状态
│   ├── user.ts
│   ├── project.ts
│   ├── requirement.ts
│   └── ai.ts
│
├── views/
│   ├── projects/
│   │   ├── ProjectListView.vue
│   │   └── ProjectDetailView.vue
│   ├── requirements/
│   │   ├── RequirementListView.vue
│   │   ├── RequirementDetailView.vue
│   │   └── RequirementChatView.vue
│   ├── tasks/
│   │   ├── TaskBoardView.vue
│   │   └── TaskDetailView.vue
│   └── layout/
│       └── MainLayout.vue
│
├── components/
│   ├── common/
│   ├── projects/
│   ├── requirements/
│   ├── tasks/
│   └── ai/
│
└── composables/                   # 组合式函数
    ├── useRequirements.ts
    ├── useTasks.ts
    └── useAI.ts
```

---

## 7. 命名规范

### 7.1 后端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体 | PascalCase | `Project`, `TaskDependency` |
| 服务 | PascalCase | `ProjectsService` |
| 控制器 | PascalCase | `ProjectsController` |
| DTO | PascalCase | `CreateProjectDto` |
| 方法 | camelCase | `findAll`, `createProject` |
| 数据库列 | snake_case | `project_id`, `created_at` |
| 枚举值 | snake_case | `in_progress`, `high_priority` |

### 7.2 前端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `RequirementCard.vue` |
| 视图 | PascalCase | `RequirementListView.vue` |
| Store | camelCase | `useProjectStore` |
| API 函数 | camelCase | `getProjects`, `createTask` |
| Props | camelCase | `projectId`, `isLoading` |
| 事件 | kebab-case | `on-click`, `update:model-value` |
