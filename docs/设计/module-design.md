# 技术设计文档 - 模块详细设计

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

### 2.3 DTO 定义

```typescript
// dto/create-project.dto.ts
import { IsString, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedManDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetManDays?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: ProjectStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedManDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetManDays?: number;
}

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectMemberRole)
  role: ProjectMemberRole;
}

export enum ProjectMemberRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}
```

### 2.4 服务实现

```typescript
// services/projects.service.ts
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      ...dto,
      ownerId: userId,
    });
    const saved = await this.projectRepo.save(project);

    // 自动添加创建者为 owner
    await this.memberRepo.save({
      projectId: saved.id,
      userId,
      role: ProjectMemberRole.OWNER,
    });

    return saved;
  }

  async findAll(userId: string, query: ListQueryDto): Promise<PaginatedResult<Project>> {
    const qb = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.members', 'members')
      .where('project.deletedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('project.ownerId = :userId')
            .orWhere('members.userId = :userId');
        }),
      );

    if (query.status) {
      qb.andWhere('project.status = :status', { status: query.status });
    }

    if (query.keyword) {
      qb.andWhere(
        new Brackets((qb) => {
          qb.where('project.name ILIKE :keyword', { keyword: `%${query.keyword}%` })
            .orWhere('project.description ILIKE :keyword', { keyword: `%${query.keyword}%` });
        }),
      );
    }

    return this.paginate(qb, query);
  }

  async addMember(projectId: string, dto: AddMemberDto): Promise<ProjectMember> {
    const project = await this.findById(projectId);
    await this.ensureUserAccess(project.id);

    const member = this.memberRepo.create({
      projectId: project.id,
      userId: dto.userId,
      role: dto.role,
    });

    return this.memberRepo.save(member);
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.memberRepo.delete({ projectId, userId });
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return this.memberRepo.find({
      where: { projectId },
      relations: ['user'],
    });
  }
}
```

### 2.5 控制器

```typescript
// controllers/projects.controller.ts
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: ListQueryDto) {
    return this.projectsService.findAll(user.id, query);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.projectsService.delete(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projectsService.addMember(id, dto);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.projectsService.removeMember(id, userId);
  }
}
```

### 2.6 模块定义

```typescript
// projects.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember]),
    UsersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

---

## 3. 功能模块管理 (FeatureModules)

### 3.1 目录结构

```
modules/feature-modules/
├── dto/
│   ├── create-module.dto.ts
│   ├── update-module.dto.ts
│   └── index.ts
├── entities/
│   ├── feature-module.entity.ts
│   └── index.ts
├── services/
│   └── feature-modules.service.ts
├── controllers/
│   └── feature-modules.controller.ts
└── feature-modules.module.ts
```

### 3.2 实体定义

```typescript
// entities/feature-module.entity.ts
export enum ModuleType {
  SYSTEM = 'system',
  BUSINESS = 'business',
  FEATURE = 'feature',
}

export enum ModuleStatus {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  COMPLETED = 'completed',
  DEPRECATED = 'deprecated',
}

@Entity('feature_modules')
export class FeatureModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.modules)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'parent_module_id', nullable: true })
  parentModuleId: string;

  @ManyToOne(() => FeatureModule, (module) => module.children, { nullable: true })
  @JoinColumn({ name: 'parent_module_id' })
  parentModule: FeatureModule;

  @OneToMany(() => FeatureModule, (module) => module.parentModule)
  children: FeatureModule[];

  @Column({
    name: 'module_type',
    type: 'enum',
    enum: ModuleType,
  })
  moduleType: ModuleType;

  @Column({
    type: 'enum',
    enum: ModuleStatus,
    default: ModuleStatus.PLANNING,
  })
  status: ModuleStatus;

  @Column({
    name: 'estimated_story_points',
    type: 'integer',
    default: 0,
  })
  estimatedStoryPoints: number;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

---

## 4. 需求管理模块 (Requirements)

### 4.1 目录结构

```
modules/requirements/
├── dto/
│   ├── create-requirement.dto.ts
│   ├── update-requirement.dto.ts
│   ├── approve-requirement.dto.ts
│   ├── list-requirement.dto.ts
│   └── index.ts
├── entities/
│   ├── requirement.entity.ts
│   ├── requirement-change-log.entity.ts
│   └── index.ts
├── services/
│   ├── requirements.service.ts
│   ├── requirement-state.service.ts
│   └── requirements.service.spec.ts
├── controllers/
│   └── requirements.controller.ts
├── requirements.module.ts
└── requirements.constants.ts
```

### 4.2 实体定义

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
  PROCESSING = 'processing',  // 新增：实施中
  COMPLETED = 'completed',     // 新增：已完成
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

  @ManyToOne(() => Requirement, (req) => req.children, { nullable: true })
  @JoinColumn({ name: 'parent_requirement_id' })
  parentRequirement: Requirement;

  @OneToMany(() => Requirement, (req) => req.parentRequirement)
  children: Requirement[];

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

### 4.3 状态机服务

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
    [RequirementStatus.COMPLETED, [RequirementStatus.PROCESSING]], // 重新打开
    [RequirementStatus.CANCELLED, []],
  ]);

  canTransition(from: RequirementStatus, to: RequirementStatus): boolean {
    const allowed = this.transitions.get(from) || [];
    return allowed.includes(to);
  }

  getNextStatuses(current: RequirementStatus): RequirementStatus[] {
    return this.transitions.get(current) || [];
  }

  async transition(
    requirement: Requirement,
    toStatus: RequirementStatus,
    userId: string,
    reason?: string,
  ): Promise<Requirement> {
    if (!this.canTransition(requirement.status, toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${requirement.status} to ${toStatus}`,
      );
    }

    const oldStatus = requirement.status;
    requirement.status = toStatus;

    // 记录变更日志
    await this.changeLogService.log({
      requirementId: requirement.id,
      changeType: ChangeType.STATUS_CHANGE,
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: toStatus,
      changeReason: reason,
      changedById: userId,
    });

    return this.requirementRepo.save(requirement);
  }
}
```

---

## 5. 任务管理模块 (Tasks)

### 5.1 目录结构

```
modules/tasks/
├── dto/
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   ├── update-task-status.dto.ts
│   ├── assign-task.dto.ts
│   ├── add-dependency.dto.ts
│   └── index.ts
├── entities/
│   ├── task.entity.ts
│   ├── task-dependency.entity.ts
│   └── index.ts
├── services/
│   ├── tasks.service.ts
│   ├── task-number.generator.ts
│   └── tasks.service.spec.ts
├── controllers/
│   └── tasks.controller.ts
└── tasks.module.ts
```

### 5.2 实体定义

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

  @ManyToOne(() => Requirement, (req) => req.tasks)
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

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

  @ManyToOne(() => Task, (task) => task.children, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  children: Task[];

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

### 5.3 任务依赖

```typescript
// entities/task-dependency.entity.ts
export enum DependencyType {
  BLOCKS = 'blocks',
  RELATES_TO = 'relates_to',
}

@Entity('task_dependencies')
export class TaskDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prerequisite_task_id' })
  prerequisiteTaskId: string;

  @ManyToOne(() => Task, (task) => task.dependentDependencies)
  @JoinColumn({ name: 'prerequisite_task_id' })
  prerequisiteTask: Task;

  @Column({ name: 'dependent_task_id' })
  dependentTaskId: string;

  @ManyToOne(() => Task, (task) => task.prerequisiteDependencies)
  @JoinColumn({ name: 'dependent_task_id' })
  dependentTask: Task;

  @Column({ name: 'dependency_type', type: 'enum', enum: DependencyType })
  dependencyType: DependencyType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## 6. AI 模块 (LLM & AI)

### 6.1 目录结构

```
modules/llm/
├── dto/
│   ├── create-config.dto.ts
│   ├── update-config.dto.ts
│   └── index.ts
├── entities/
│   ├── llm-config.entity.ts
│   └── index.ts
├── providers/
│   ├── llm-provider.interface.ts
│   ├── base.provider.ts
│   ├── deepseek.provider.ts
│   ├── openai.provider.ts
│   └── ollama.provider.ts
├── services/
│   ├── llm-config.service.ts
│   └── llm.service.ts
├── controllers/
│   └── llm.controller.ts
└── llm.module.ts

modules/ai/
├── dto/
│   ├── chat.dto.ts
│   ├── generate.dto.ts
│   ├── breakdown.dto.ts
│   └── index.ts
├── services/
│   ├── ai-chat.service.ts
│   ├── ai-generate.service.ts
│   ├── ai-breakdown.service.ts
│   ├── vector-search.service.ts
│   └── conflict-analysis.service.ts
├── controllers/
│   └── ai.controller.ts
└── ai.module.ts
```

### 6.2 LLM Provider 接口

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

### 6.3 DeepSeek Provider

```typescript
// providers/deepseek.provider.ts
@Injectable()
export class DeepSeekProvider implements LLMProvider {
  readonly name = 'DeepSeek';
  readonly provider = LLMProviderType.DEEPSEEK;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async call(messages: LLMMessage[], options?: CallOptions): Promise<LLMResponse> {
    const config = await this.getConfig();

    const response = await firstValueFrom(
      this.httpService.post(
        `${config.apiEndpoint}/chat/completions`,
        {
          model: config.modelId,
          messages,
          temperature: options?.temperature ?? config.temperature,
          max_tokens: options?.maxTokens ?? config.maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: options?.timeout ?? config.timeout,
        },
      ),
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.call([
        { role: 'user', content: 'Hi' },
      ]);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 7. 共享模块

### 7.1 通用 DTO

```typescript
// shared/dto/pagination.dto.ts
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class ListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### 7.2 通用响应拦截器

```typescript
// shared/interceptors/api-response.interceptor.ts
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}
```

### 7.3 通用异常过滤器

```typescript
// shared/filters/api-exception.filter.ts
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const err = exception.getResponse() as any;
      message = err.message || exception.message;
      code = err.code || 'HTTP_ERROR';
    }

    response.status(status).json({
      code,
      message,
      time: new Date().toISOString(),
    });
  }
}
```

---

## 8. 模块注册

### 8.1 App Module

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      // ... 配置
      entities: [
        User,
        Project,
        ProjectMember,
        FeatureModule,
        Requirement,
        UserStory,
        AcceptanceCriteria,
        Task,
        TaskDependency,
        RequirementChangeLog,
        RawRequirementCollection,
        RawRequirement,
        LLMConfig,
      ],
      synchronize: false,
      migrationsRun: true,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
    }),
    // 共享模块
    AuthModule,
    UsersModule,
    // 业务模块
    ProjectsModule,
    FeatureModulesModule,
    RequirementsModule,
    UserStoriesModule,
    AcceptanceCriteriaModule,
    TasksModule,
    RawRequirementsModule,
    LLMModule,
    AIModule,
    // 基础设施
    DatabaseModule,
    RedisModule,
    ChromaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 9. 前端模块组织

### 9.1 Vue 项目结构

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
│   │   └── RequirementChatView.vue  # AI Chat 界面
│   ├── tasks/
│   │   ├── TaskBoardView.vue         # 看板
│   │   └── TaskDetailView.vue
│   └── layout/
│       └── MainLayout.vue
│
├── components/
│   ├── common/
│   ├── projects/
│   ├── requirements/
│   │   ├── RequirementCard.vue
│   │   ├── RequirementForm.vue
│   │   └── RequirementChat.vue        # Chat 组件
│   ├── tasks/
│   │   ├── TaskCard.vue
│   │   ├── TaskColumn.vue
│   │   └── KanbanBoard.vue
│   └── ai/
│       ├── RelatedAnalysis.vue        # 关联分析
│       ├── ConflictCard.vue
│       └── SimilarCard.vue
│
└── composables/                   # 组合式函数
    ├── useRequirements.ts
    ├── useTasks.ts
    └── useAI.ts
```

---

## 10. 命名规范

### 10.1 后端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 实体 | PascalCase | `Project`, `TaskDependency` |
| 服务 | PascalCase | `ProjectsService` |
| 控制器 | PascalCase | `ProjectsController` |
| DTO | PascalCase | `CreateProjectDto` |
| 方法 | camelCase | `findAll`, `createProject` |
| 数据库列 | snake_case | `project_id`, `created_at` |
| 枚举值 | snake_case | `in_progress`, `high_priority` |

### 10.2 前端命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `RequirementCard.vue` |
| 视图 | PascalCase | `RequirementListView.vue` |
| Store | camelCase | `useProjectStore` |
| API 函数 | camelCase | `getProjects`, `createTask` |
| Props | camelCase | `projectId`, `isLoading` |
| 事件 | kebab-case | `on-click`, `update:model-value` |
