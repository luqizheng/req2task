# Project Wizard 规范文档

## 1. 背景与目标

### 1.1 用户痛点
- 初次使用系统的用户不清楚如何配置项目
- 项目配置分散，缺乏引导
- 技术选型决策困难

### 1.2 目标
- 通过 LLM 驱动的向导式界面，引导用户完成项目初始化配置
- 收集项目技术栈、架构类型、数据库配置等关键信息
- 为后续需求分析和任务分解提供上下文

### 1.3 用户故事
**场景 1: 新用户首次创建项目**
```
作为新用户，我希望通过向导快速配置项目基本信息，
以便系统能理解项目背景并提供智能辅助。
```

**场景 2: 技术负责人初始化项目**
```
作为技术负责人，我希望系统能识别项目的技术选型，
以便后续的需求能关联到正确的技术上下文。
```

## 2. 系统类型体系

### 2.1 SystemType 枚举
```typescript
enum SystemType {
  ECOMMERCE = 'ECOMMERCE',           // 电商系统
  CMS = 'CMS',                       // 内容管理系统
  ERP = 'ERP',                       // 企业资源计划
  CRM = 'CRM',                       // 客户关系管理
  OA = 'OA',                         // 办公自动化
  LMS = 'LMS',                       // 学习管理系统
  MES = 'MES',                       // 制造执行系统
  SCM = 'SCM',                       // 供应链管理
  HEALTHCARE = 'HEALTHCARE',         // 医疗健康系统
  FINTECH = 'FINTECH',               // 金融科技
  IOT = 'IOT',                       // 物联网平台
  GAMING = 'GAMING',                 // 游戏平台
  SOCIAL = 'SOCIAL',                 // 社交平台
  EDUCATION = 'EDUCATION',           // 在线教育
  CUSTOM = 'CUSTOM'                  // 定制开发
}
```

### 2.2 ArchitectureType 枚举
```typescript
enum ArchitectureType {
  MONOLITHIC = 'MONOLITHIC',         // 单体架构
  MICROSERVICE = 'MICROSERVICE',     // 微服务架构
  SERVERLESS = 'SERVERLESS',         // 无服务器架构
  MICROSERVICE_MONO_REPO = 'MICROSERVICE_MONO_REPO',  // 微服务单体仓库
  MODULAR_MONOLITH = 'MODULAR_MONOLITH',  // 模块化单体
  EVENT_DRIVEN = 'EVENT_DRIVEN',     // 事件驱动架构
  LAYERED = 'LAYERED',               // 分层架构
  HEXAGONAL = 'HEXAGONAL',           // 六边形架构
  DDD = 'DDD'                        // 领域驱动设计
}
```

### 2.3 DatabaseType 枚举
```typescript
enum DatabaseType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  REDIS = 'REDIS',
  ELASTICSEARCH = 'ELASTICSEARCH',
  MARIADB = 'MARIADB',
  ORACLE = 'ORACLE',
  SQLSERVER = 'SQLSERVER',
  SQLITE = 'SQLITE',
  DYNAMODB = 'DYNAMODB',
  COUCHDB = 'COUCHDB',
  NEO4J = 'NEO4J',
  TIMESERIES = 'TIMESERIES'          // 时序数据库（InfluxDB）
}
```

### 2.4 CloudProvider 枚举
```typescript
enum CloudProvider {
  ALIYUN = 'ALIYUN',                 // 阿里云
  TENCENT = 'TENCENT',               // 腾讯云
  HUAWEI = 'HUAWEI',                 // 华为云
  AWS = 'AWS',                       // 亚马逊云
  GCP = 'GCP',                       // 谷歌云
  AZURE = 'AZURE',                   // 微软云
  SELF_HOSTED = 'SELF_HOSTED'        // 自托管
}
```

### 2.5 SecurityLevel 枚举
```typescript
enum SecurityLevel {
  BASIC = 'BASIC',                   // 基础安全
  STANDARD = 'STANDARD',             // 标准安全
  ENHANCED = 'ENHANCED',            // 增强安全
  HIGH = 'HIGH'                      // 高级安全（金融/医疗）
}
```

### 2.6 ProjectScale 枚举
```typescript
enum ProjectScale {
  SMALL = 'SMALL',                   // 小型 (< 10人)
  MEDIUM = 'MEDIUM',                 // 中型 (10-50人)
  LARGE = 'LARGE',                   // 大型 (50-200人)
  ENTERPRISE = 'ENTERPRISE'         // 企业级 (> 200人)
}
```

## 3. 技术栈配置

### 3.1 TechStack 配置结构
```typescript
interface TechStack {
  frontend: FrontendStack;
  backend: BackendStack;
  infrastructure: InfrastructureStack;
  devops: DevOpsStack;
}

interface FrontendStack {
  framework: string;                 // Vue3, React, Angular, Svelte, Next.js, Nuxt
  uiLibrary?: string;                // Element Plus, Ant Design, Material UI, Naive UI
  stateManagement?: string;          // Pinia, Redux, Zustand, Jotai
  buildTool?: string;               // Vite, Webpack, Turbopack
  language: string;                 // TypeScript, JavaScript
}

interface BackendStack {
  framework: string;                 // NestJS, Express, Fastify, Spring Boot, Django, Gin
  language: string;                  // TypeScript, Java, Python, Go, Rust, C#
  orm?: string;                      // TypeORM, Prisma, Sequelize, Typegoose
  apiStyle?: string;                // REST, GraphQL, gRPC, tRPC
  caching?: string[];               // Redis, Memcached
  messageQueue?: string[];          // Kafka, RabbitMQ, Redis Streams
}

interface InfrastructureStack {
  container: string;               // Docker, Podman
  orchestration?: string;           // Kubernetes, Docker Compose
  reverseProxy?: string;            // Nginx, Traefik, Caddy
  loadBalancer?: string;            // HAProxy, Nginx
}

interface DevOpsStack {
  ciCd: string;                     // GitHub Actions, GitLab CI, Jenkins, ArgoCD
  containerRegistry?: string;       // Docker Hub,阿里云容器镜像服务
  monitoring?: string[];            // Prometheus, Grafana, Loki
  logging?: string[];               // ELK, Loki, Jaeger
  tracing?: string;                 // Jaeger, Zipkin
  codeQuality?: string[];          // ESLint, Prettier, SonarQube
}
```

## 4. 数据库设计

### 4.1 扩展 Project 实体字段
```typescript
// packages/core/src/entities/project.entity.ts

@Entity('projects')
export class Project {
  // === 现有字段 ===
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'project_key', unique: true })
  projectKey!: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status!: ProjectStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members!: User[];

  @Column({ name: 'owner_id' })
  ownerId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // === 新增 Wizard 配置字段 ===

  @Column({
    type: 'enum',
    enum: SystemType,
    nullable: true,
    name: 'system_type'
  })
  systemType!: SystemType | null;

  @Column({
    type: 'enum',
    enum: ArchitectureType,
    nullable: true,
    name: 'architecture_type'
  })
  architectureType!: ArchitectureType | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'tech_stack'
  })
  techStack!: TechStack | null;

  @Column({
    type: 'enum',
    enum: DatabaseType,
    array: true,
    nullable: true,
    name: 'database_types'
  })
  databaseTypes!: DatabaseType[];

  @Column({
    type: 'enum',
    enum: CloudProvider,
    nullable: true,
    name: 'cloud_provider'
  })
  cloudProvider!: CloudProvider | null;

  @Column({
    type: 'enum',
    enum: SecurityLevel,
    nullable: true,
    name: 'security_level'
  })
  securityLevel!: SecurityLevel | null;

  @Column({
    type: 'enum',
    enum: ProjectScale,
    nullable: true,
    name: 'project_scale'
  })
  projectScale!: ProjectScale | null;

  @Column({ type: 'int', nullable: true, name: 'team_size' })
  teamSize!: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_microservices' })
  isMicroservices!: boolean;

  @Column({ type: 'int', nullable: true, name: 'expected_duration_months' })
  expectedDurationMonths!: number | null;

  @Column({ type: 'numeric', nullable: true, name: 'budget' })
  budget!: number | null;

  @Column({ type: 'text', nullable: true, name: 'business_domain' })
  businessDomain!: string | null;

  @Column({ type: 'text', nullable: true, name: 'target_audience' })
  targetAudience!: string | null;

  @Column({ type: 'boolean', default: false, name: 'wizard_completed' })
  wizardCompleted!: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'wizard_config' })
  wizardConfig!: Record<string, unknown> | null;
}
```

## 5. Wizard 流程设计

### 5.1 Wizard 步骤定义
```typescript
interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardField[];
  aiSuggestion?: boolean;
}

interface WizardField {
  key: string;
  type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean' | 'json';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: FieldValidation;
  aiGenerated?: boolean;
}

interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}
```

### 5.2 Wizard 步骤列表
```
步骤 1: 项目基础信息
  - name: 项目名称
  - description: 项目描述
  - businessDomain: 业务领域

步骤 2: 系统类型识别
  - systemType: 系统类型（AI 推荐）
  - targetAudience: 目标用户

步骤 3: 架构决策
  - architectureType: 架构类型
  - isMicroservices: 是否微服务

步骤 4: 技术栈选择
  - frontend: 前端技术栈
  - backend: 后端技术栈
  - infrastructure: 基础设施

步骤 5: 数据库配置
  - databaseTypes: 数据库类型（多选）
  - orm: ORM 框架

步骤 6: 部署配置
  - cloudProvider: 云服务商
  - securityLevel: 安全等级

步骤 7: 项目规模
  - projectScale: 项目规模
  - teamSize: 团队人数
  - expectedDurationMonths: 预计周期

步骤 8: 完成确认
  - 展示完整配置
  - 确认创建
```

## 6. API 接口规范

### 6.1 Wizard API
```typescript
// 获取 Wizard 步骤配置
GET /api/projects/wizard/steps
Response: WizardStep[]

// 获取 AI 建议
POST /api/projects/wizard/suggest
Body: { stepId: string; context: ProjectContext }
Response: AISuggestion

// 保存 Wizard 进度
POST /api/projects/wizard/progress
Body: WizardProgressDTO
Response: Project

// 创建项目（完成 Wizard）
POST /api/projects/wizard/complete
Body: CreateProjectDTO
Response: Project

// 获取项目技术栈建议
POST /api/projects/wizard/tech-stack-suggestion
Body: { systemType: SystemType; architectureType: ArchitectureType }
Response: TechStack
```

## 7. LLM 集成设计

### 7.1 AI 推荐 Prompt
```typescript
const WIZARD_SYSTEM_PROMPT = `你是一个资深的系统架构师，擅长根据项目需求推荐合适的技术栈。
请根据用户提供的项目信息，推荐：
1. 适合的系统类型
2. 推荐的架构模式
3. 技术栈选型建议
4. 数据库选型建议

回答要简洁、专业，给出推荐理由。`;

const WIZARD_USER_PROMPT = `
项目名称：{{projectName}}
业务领域：{{businessDomain}}
系统描述：{{description}}

请给出技术栈推荐建议。`;
```

## 8. 验证条件

### 8.1 创建项目的必要条件
```typescript
// Given: 用户完成 Wizard 所有必填步骤
// When: 提交项目创建
// Then: 
//   - 项目名称不能为空
//   - 项目 Key 唯一性验证
//   - Wizard 进度完整

// Given: Wizard 未完成
// When: 尝试创建项目
// Then: 返回错误提示
```

## 9. 依赖关系
- [project.entity.ts](d:\projects\req2task\packages\core\src\entities\project.entity.ts) - 实体定义
- [packages/dto](d:\projects\req2task\packages\dto) - DTO 类型定义
- [apps/service](d:\projects\req2task\apps\service) - API 实现
- [apps/web](d:\projects\req2task\apps\web) - 前端组件实现
- [apps/ai-chat-service](d:\projects\req2task\apps\ai-chat-service) - LLM 集成
