---
last_updated: 2025-04-30
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

## 3. 功能模块 (FeatureModules)

### 3.1 目录结构

```
modules/feature-modules/
├── dto/
│   ├── create-feature-module.dto.ts
│   ├── update-feature-module.dto.ts
│   └── index.ts
├── entities/
│   └── feature-module.entity.ts
├── services/
│   ├── feature-modules.service.ts
│   └── feature-modules.service.spec.ts
├── controllers/
│   └── feature-modules.controller.ts
└── feature-modules.module.ts
```

### 3.2 实体定义

```typescript
// entities/feature-module.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { Requirement } from './requirement.entity';

@Entity('feature_modules')
export class FeatureModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // 模块唯一标识，用于生成编译编号（如 AUTH-001）
  @Column({ name: 'module_key' })
  moduleKey: string;

  // 别名列表（JSONB），如 ["用户认证", "身份验证"]
  // 用于 LLM 理解模块语义
  @Column({ type: 'jsonb', nullable: true })
  aliases: string[] | null;

  // 关键词列表（JSONB），如 ["登录", "注册", "鉴权"]
  // 用于 LLM 匹配需求归属
  @Column({ type: 'jsonb', nullable: true })
  keywords: string[] | null;

  // 完整路径，如 "系统设置 / 权限管理 / 角色分配"
  // 从根节点到当前模块的层级路径
  @Column({ type: 'text', nullable: true })
  path: string | null;

  // 排序顺序
  @Column({ default: 0 })
  sort: number;

  // 树形结构：父模块
  @Column({ name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => FeatureModule, (module) => module.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: FeatureModule | null;

  // 树形结构：子模块
  @OneToMany(() => FeatureModule, (module) => module.parent)
  children: FeatureModule[];

  // 所属项目
  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // 多对多关系：关联的需求
  @ManyToMany(() => Requirement, (req) => req.modules)
  requirements: Requirement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| moduleKey | string | 模块唯一标识，用于生成编译编号 |
| aliases | string[] | 别名列表，便于 LLM 理解模块语义，如 `["用户认证", "身份验证"]` |
| keywords | string[] | 关键词列表，用于 LLM 匹配需求归属，如 `["登录", "注册", "鉴权"]` |
| path | string | 完整路径，从根节点到当前模块，如 `"系统设置 / 权限管理 / 角色分配"` |
| sort | number | 同级模块排序顺序 |
| parent/parentId | FeatureModule | 树形结构父模块 |
| children | FeatureModule[] | 树形结构子模块 |
| requirements | Requirement[] | 关联的需求列表（多对多） |

**路径计算逻辑：**
```typescript
private async calculatePath(module: FeatureModule): Promise<string> {
  const paths: string[] = [module.name];
  let current = module;
  while (current.parentId) {
    const parent = await this.featureModuleRepository.findOne({
      where: { id: current.parentId },
    });
    if (parent) {
      paths.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }
  return paths.join(' / ');
}
```

### 3.3 DTO 定义

```typescript
// dto/create-feature-module.dto.ts
export class CreateFeatureModuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  moduleKey: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsString()
  projectId: string;
}

// dto/update-feature-module.dto.ts
export class UpdateFeatureModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @IsOptional()
  @IsString()
  parentId?: string;
}

// dto/feature-module-response.dto.ts
export class FeatureModuleResponseDto {
  id: string;
  name: string;
  description: string | null;
  moduleKey: string;
  aliases: string[] | null;
  keywords: string[] | null;
  path: string | null;
  sort: number;
  parentId: string | null;
  projectId: string;
  children: FeatureModuleResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. 需求管理模块 (Requirements)

### 4.1 实体定义

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

  @Column({ name: 'entity_key', unique: true })
  entityKey: string;

  // 多对多关系：一个需求可关联多个模块
  @ManyToMany(() => FeatureModule, (module) => module.requirements, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'requirement_modules',
    joinColumn: { name: 'requirement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'module_id', referencedColumnName: 'id' },
  })
  modules: FeatureModule[];

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'key_elements', type: 'simple-array', nullable: true })
  keyElements: string[] | null;

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

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Requirement, (req) => req.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Requirement | null;

  @OneToMany(() => Requirement, (req) => req.parent)
  children: Requirement[];

  @Column({ name: 'source_raw_requirement_id', type: 'uuid', nullable: true })
  sourceRawRequirementId: string | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string | null;

  @Column({ name: 'review_chain_id', type: 'uuid', nullable: true })
  reviewChainId: string | null;

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
}
```

**关键变更说明：**
- ~~删除 `moduleId` 字段（单模块关联）~~
- ~~删除 `moduleIds` 字段（simple-array）~~
- 新增 `entityKey` 字段：业务编号，用于生成编译编号
- 新增 `modules` 多对多关系：通过 `requirement_modules` 关联表实现
- 新增 `keyElements` 字段：需求关键要素
- 新增 `parent`/`children` 自关联：支持需求层级结构

### 4.2 状态机服务

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

## 5. 任务管理模块 (Tasks)

### 5.1 实体定义

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

## 6. AI 模块 (LLM & AI)

### 6.1 LLM Provider 接口

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

## 7. 前端模块组织

### 7.1 Vue 项目结构

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

## 8. 命名规范

### 8.1 后端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体 | PascalCase | `Project`, `TaskDependency` |
| 服务 | PascalCase | `ProjectsService` |
| 控制器 | PascalCase | `ProjectsController` |
| DTO | PascalCase | `CreateProjectDto` |
| 方法 | camelCase | `findAll`, `createProject` |
| 数据库列 | snake_case | `project_id`, `created_at` |
| 枚举值 | snake_case | `in_progress`, `high_priority` |

### 8.2 前端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `RequirementCard.vue` |
| 视图 | PascalCase | `RequirementListView.vue` |
| Store | camelCase | `useProjectStore` |
| API 函数 | camelCase | `getProjects`, `createTask` |
| Props | camelCase | `projectId`, `isLoading` |
| 事件 | kebab-case | `on-click`, `update:model-value` |
