---
last_updated: 2026-05-11
status: active
owner: req2task团队
---

# req2task 项目概览文档

## 1. 项目定位

req2task（需求转任务）是一个面向需求分析师、开发人员和项目经理的**软件需求管理系统**，核心能力：

- 需求全生命周期管理（采集→分析→结构化→评审→拆分→任务→追踪）
- AI 辅助需求生成（原始需求分析、结构化需求生成、用户故事拆分、任务分解）
- 多维度信息关联（需求↔模块↔用户故事↔验收标准↔任务）
- 变更追溯（基线快照、变更日志）
- 项目进度可视化（看板、燃尽图）
- 项目知识库构建（向量存储、语义检索）

## 2. 技术栈

| 层面        | 技术                                                               |
| ----------- | ------------------------------------------------------------------ |
| 包管理      | pnpm@10.33.0 monorepo                                              |
| 前端        | Vue 3 + Vite 6 + Pinia + Vue Router + shadcn-vue + Tailwind CSS v4 |
| 后端        | NestJS + TypeORM + PostgreSQL                                      |
| AI 聊天服务 | Express + TypeORM + PostgreSQL + @themaximalist/llm.js             |
| 语言        | TypeScript（全栈）                                                 |
| 共享包编译  | tsup（ESM + CJS 双格式）                                           |
| 对象存储    | RustFS（S3 协议兼容）                                              |
| 向量存储    | ChromaDB + Ollama Embedding                                        |
| 表单验证    | VeeValidate + Zod（前端）、class-validator（后端）                 |

## 3. Monorepo 结构

```
req2task/
├── packages/
│   ├── core/              # 后端核心业务代码（实体、服务、Prompt 模板）
│   ├── dto/               # 前后端共享 DTO 定义（枚举、请求/响应类型）
│   └── dev-config/        # tsup 共享编译配置
├── apps/
│   ├── web/               # Vue 3 前端
│   ├── service/           # NestJS 后端主服务
│   └── ai-chat-service/   # AI 聊天服务（独立 Express 应用）
├── docs/                  # 项目文档
└── scripts/               # 构建/开发脚本
```

### 3.1 packages/core — 核心业务包

被 `apps/service` 依赖，提供实体定义和服务层。

**实体清单：**

| 实体                 | 说明             | 关键字段                                                                   |
| -------------------- | ---------------- | -------------------------------------------------------------------------- |
| User                 | 用户             | username, email, displayName, role                                         |
| Project              | 项目             | name, projectKey, status, techStack, ownerId                               |
| FeatureModule        | 功能模块（树形） | name, moduleKey, parentId, projectId, aliases, keywords                    |
| RawRequirement       | 原始需求         | originalContent, clarifiedContent, status, keyElements, questionAndAnswers |
| Requirement          | 结构化需求       | entityKey, title, description, priority, source, status, storyPoints       |
| UserStory            | 用户故事         | role, goal, benefit, storyPoints                                           |
| AcceptanceCriteria   | 验收标准         | criteriaType, content, testMethod                                          |
| Task                 | 任务             | taskNo, title, status, priority, estimatedHours, assignedToId              |
| RequirementChangeLog | 需求变更日志     | changeType, field, oldValue, newValue                                      |
| Baseline             | 基线             | name, snapshotData                                                         |
| Conversation         | 对话             | title, status, summary, conversationType                                   |
| ConversationMessage  | 对话消息         | role, content, rawRequirementId                                            |
| Notification         | 通知             | type, title, message, isRead                                               |
| FileData             | 文件数据         | fileName, filePath, mimeType                                               |
| ProjectAttachment    | 项目附件         | targetType, targetId, rustfsFileId                                         |

**服务清单：**

| 服务                    | 职责                                            |
| ----------------------- | ----------------------------------------------- |
| UserService             | 用户业务逻辑                                    |
| RequirementStateService | 需求状态机（DRAFT→REVIEWED→APPROVED→COMPLETED） |
| WizardService           | 项目向导                                        |
| PromptService           | Prompt 模板管理                                 |
| RenderService           | 模板渲染（Mustache）                            |

**Prompt 模板：**

| Code                     | 用途                       |
| ------------------------ | -------------------------- |
| RAW_REQUIREMENT_ANALYSIS | 分析原始需求，提取关键要素 |
| REQUIREMENT_GENERATION   | 从原始需求生成结构化需求   |
| USER_STORY_GENERATION    | 从需求生成用户故事         |
| TASK_DECOMPOSITION       | 从需求分解任务             |
| REVIEW                   | 评审需求                   |
| QUALITY_CHECK            | 质量检查                   |
| CONFLICT_DETECTION       | 冲突检测                   |
| CONVERSATION             | 对话辅助                   |

### 3.2 packages/dto — 共享 DTO 包

前后端唯一的类型来源，确保 API 类型一致。

**枚举清单：**

| 枚举                 | 值                                                                      |
| -------------------- | ----------------------------------------------------------------------- |
| UserRole             | admin, user, projectManager, requirementAnalyst, developer, tester      |
| ProjectStatus        | planning, active, on_hold, completed, archived                          |
| RequirementStatus    | draft, reviewed, approved, rejected, processing, completed, cancelled   |
| RequirementSource    | manual, ai_generated, document_import                                   |
| RawRequirementStatus | pending, processing, completed, clarified, converted, discarded, failed |
| Priority             | critical, high, medium, low                                             |
| TaskStatus           | todo, in_progress, in_review, done, blocked, cancelled                  |
| TaskPriority         | critical, high, medium, low                                             |
| CriteriaType         | functional, non_functional                                              |
| LLMProviderType      | deepseek, openai, ollama                                                |
| ConversationStatus   | active, archived                                                        |
| MessageRole          | system, user, assistant                                                 |
| CollectionType       | text, document, conversation, import                                    |
| ChangeType           | created, updated, status_changed, deleted                               |
| ConflictType         | duplicate, contradiction, overlap                                       |
| SystemType           | web_app, mobile_app, desktop_app, api_service, microservice             |
| ArchitectureType     | monolith, layered, microservices, serverless, event_driven              |
| DatabaseType         | postgresql, mysql, mongodb, redis, elasticsearch                        |
| CloudProvider        | aws, azure, gcp, aliyun, none                                           |
| SecurityLevel        | low, medium, high, critical                                             |
| ProjectScale         | small, medium, large, enterprise                                        |
| Permission           | 管理员/项目经理/需求分析师/开发/测试权限集                              |
| AttachmentTargetType | project, requirement, raw_requirement                                   |

**DTO 模块：**

| 模块             | 说明                                              |
| ---------------- | ------------------------------------------------- |
| project/         | 项目 CRUD、基线、功能模块、向导                   |
| requirement/     | 需求 CRUD、用户故事、验收标准、状态转换、变更历史 |
| raw-requirement/ | 原始需求 CRUD、AI 生成                            |
| ai/              | AI 生成、冲突检测、质量检查、向量重建             |
| auth/            | 登录注册                                          |
| user/            | 用户管理                                          |
| llm-config/      | LLM 配置 CRUD                                     |
| conversation/    | 对话管理                                          |
| notification/    | 通知管理                                          |
| attachment/      | 附件管理                                          |
| rustfs/          | 对象存储                                          |
| common/          | 通用响应(ApiResponseDto)、分页                    |

### 3.3 apps/web — Vue 3 前端

**路由结构：**

| 路径                                      | 页面                  | 说明           |
| ----------------------------------------- | --------------------- | -------------- |
| /login                                    | LoginView             | 登录           |
| /register                                 | RegisterView          | 注册           |
| /dashboard                                | DashboardView         | 仪表盘         |
| /projects                                 | ProjectListView       | 项目列表       |
| /projects/create                          | ProjectCreateView     | 创建项目       |
| /projects/new/wizard                      | ProjectWizardView     | 项目向导       |
| /projects/:id                             | ProjectDetailView     | 项目详情       |
| /projects/:id/settings                    | ProjectSettingsView   | 项目设置       |
| /projects/:projectId/requirements         | RequirementListView   | 需求列表       |
| /projects/:projectId/requirements/:id     | RequirementDetailView | 需求详情       |
| /projects/:projectId/raw-requirements/:id | RawRequirementEditor  | 原始需求编辑器 |
| /settings                                 | SettingsView          | 系统设置       |
| /ai/config                                | AiConfigView          | AI 配置        |
| /ai/config/:id/test                       | AiConfigTestView      | AI 配置测试    |

**页面模块：**

| 模块                  | 子组件                                                                                                                                                                                        | 说明         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| ProjectDetailView     | ProjectInfoCard, ProjectTechInfoCard, ProjectRequirementsCard, ProjectRawRequirementsCard, ProjectTasksCard, ProjectModulesCard, ProjectProgressCard, ProjectBaselinesCard, VectorRebuildCard | 项目总览     |
| RequirementDetailView | RequirementHeader, RequirementContent, RequirementActions, RequirementModules, RequirementTasks, UserStoryCard, ChangeHistoryCard, ConflictAlert                                              | 需求详情     |
| RequirementListView   | RequirementTable, RequirementSearch, RequirementFilters                                                                                                                                       | 需求列表     |
| RawRequirementEditor  | RequirementCard, QuestionPanel, RequirementList, AiModuleConfirm                                                                                                                              | AI 需求采集  |
| AiConfig              | ConfigCard, ConfigForm                                                                                                                                                                        | LLM 配置管理 |

**UI 体系：** shadcn-vue（基于 Reka UI + Tailwind CSS），使用 Field 组件替代废弃的 Form 组件。

**状态管理：** Pinia stores（user、ai、counter）— ⚠️ 缺失 project、requirement、task、userStory、acceptanceCriteria、rawRequirement、llmConfig 等 Store

### 3.4 apps/service — NestJS 后端主服务

**模块清单：**

| 模块                    | Controller                                                                  | 核心服务                                                                              | 说明                       |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------- |
| AuthModule              | AuthController                                                              | AuthService                                                                           | JWT 认证（登录/注册）      |
| UsersModule             | UsersController                                                             | UsersService                                                                          | 用户管理                   |
| ProjectsModule          | ProjectsController, WizardController                                        | ProjectsService, BaselineService, ProjectProgressService                              | 项目管理、基线、进度       |
| FeatureModulesModule    | FeatureModulesController                                                    | FeatureModulesService                                                                 | 功能模块管理（含 AI 推荐） |
| RequirementsModule      | RequirementsController, AcceptanceCriteriaController, UserStoriesController | RequirementsService, AcceptanceCriteriaService, UserStoriesService                    | 需求管理、状态流转         |
| RawRequirementModule    | RawRequirementController                                                    | RawRequirementService                                                                 | 原始需求采集               |
| TasksModule             | TasksController                                                             | TasksService, TaskKanbanService                                                       | 任务管理、看板             |
| AiModule                | —                                                                           | AiGenerationService, AiPersistenceService, LLmClientService, RequirementVectorService | AI 生成、向量存储          |
| NotificationModule      | NotificationController                                                      | NotificationService                                                                   | 通知系统                   |
| FileDataModule          | FileDataController                                                          | FileDataService, FileDataCleanupService                                               | 文件管理                   |
| ProjectAttachmentModule | ProjectAttachmentController                                                 | ProjectAttachmentService, StorageService                                              | 附件管理                   |
| RustFSModule            | RustFSController                                                            | RustFSService                                                                         | 对象存储                   |
| DeveloperWsModule       | —                                                                           | DeveloperWsGateway, DeveloperSessionService, RunnerManagerService                     | WebSocket 开发者工具       |

**AI 核心流程：**

```
原始需求输入
  → AiGenerationService.generateRawRequirement()
    → PromptService.render("RAW_REQUIREMENT_ANALYSIS")
    → LLmClientService.generate() / streamGenerate()
    → 提取 keyElements + followUpQuestions
  → AiGenerationService.generateRequirements()
    → RequirementVectorService.searchSimilarRequirements() (向量检索)
    → 关联需求注入 Prompt
    → LLM 生成结构化需求
  → AiPersistenceService.persistRequirements()
    → 写入 Requirement + UserStory + Task
    → RequirementVectorService 自动索引新需求
```

**SSE 通信规范：** 所有流式响应遵循 `metadata → content → done/error` 事件序列。

### 3.5 apps/ai-chat-service — AI 聊天服务

独立 Express 应用，负责对话管理和 LLM 交互。

**路由：**

| 路径                  | 说明                     |
| --------------------- | ------------------------ |
| /api/ai/conversations | 对话 CRUD + SSE 流式对话 |
| /api/ai/text          | 文本处理                 |
| /api/ai/llm-configs   | LLM 配置管理             |
| /health               | 健康检查                 |

**核心服务：**

| 服务                | 职责                 |
| ------------------- | -------------------- |
| ConversationService | 对话管理、消息持久化 |
| LLMService          | LLM 调用封装         |
| LlMConfigService    | LLM 配置管理         |
| ServiceApiService   | 与主服务同步数据     |

## 4. 核心业务流程

### 4.1 需求生命周期

```
原始需求采集 → AI 分析 → 关键要素提取 → 追问澄清
→ AI 生成结构化需求 → 关联检测（相似/冲突）
→ 需求评审 → 需求批准 → 用户故事拆分 → 验收标准定义
→ AI 任务分解 → 任务分配 → 任务追踪 → 完成
```

### 4.2 需求状态机

```
DRAFT → REVIEWED → APPROVED → COMPLETED
  ↓        ↓          ↓
  REJECTED  CANCELLED  CANCELLED
```

### 4.3 任务状态机

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
  ↓        ↓
BLOCKED   CANCELLED
```

### 4.4 AI 辅助能力

| 能力           | 触发方式           | 说明                               |
| -------------- | ------------------ | ---------------------------------- |
| 原始需求分析   | 输入对话文本       | AI 提取关键要素、生成追问          |
| 结构化需求生成 | 原始需求转化       | AI 生成标题、描述、优先级          |
| 关联需求检测   | 需求生成时自动触发 | 向量检索 + 冲突关键词分析          |
| 模块推荐       | 创建功能模块时     | AI 根据项目上下文推荐模块划分      |
| 用户故事生成   | 需求详情页触发     | AI 生成 As a...I want...So that... |
| 任务分解       | 需求详情页触发     | AI 将需求拆分为可执行任务          |
| 验收标准生成   | 用户故事关联       | AI 生成功能/非功能验收标准         |

## 5. 数据关系图

```
User ─┬─< Project (ownerId)
      ├─< Project.members (M:N)
      ├─< RawRequirement (createdById)
      ├─< Task (assignedToId)
      └─< Baseline (createdById)

Project ─┬─< FeatureModule (树形自关联)
         ├─< RawRequirement
         ├─< Requirement (通过 FeatureModule M:N)
         ├─< Baseline
         ├─< ProjectAttachment
         └─< Notification

Requirement ─┬─< UserStory
             ├─< Task
             ├─< RequirementChangeLog
             ├─< Requirement (parent/children 自关联)
             └─<> FeatureModule (M:N)

UserStory ──< AcceptanceCriteria

Task ──<> Task (依赖关系 M:N, parent/children 自关联)

Conversation ──< ConversationMessage
```

## 6. 开发命令速查

| 命令                         | 说明                   |
| ---------------------------- | ---------------------- |
| `pnpm dev:web`               | 启动前端开发服务器     |
| `pnpm dev:service`           | 启动后端开发服务器     |
| `pnpm dev:ai-chat-service`   | 启动 AI 聊天服务       |
| `pnpm dev:core`              | 启动核心包监听编译     |
| `pnpm dev:infra`             | 启动基础设施（Docker） |
| `pnpm build`                 | 全量构建               |
| `pnpm lint`                  | 全量 lint              |
| `pnpm test`                  | 全量单元测试           |
| `pnpm test:e2e`              | E2E 测试               |
| `pnpm db:migration:generate` | 生成数据库迁移         |
| `pnpm db:migration:run`      | 执行数据库迁移         |
| `pnpm db:seed`               | 种子数据               |

## 7. 环境配置

### 后端 (apps/service/.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=req2task
JWT_SECRET=your-secret
CHROMA_HOST=localhost
CHROMA_PORT=8000
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
RUSTFS_ENDPOINT=http://localhost:9000
RUSTFS_ACCESS_KEY=minioadmin
RUSTFS_SECRET_KEY=minioadmin
RUSTFS_BUCKET=req2task
```

### AI 聊天服务 (apps/ai-chat-service/.env)

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=req2task_ai_chat
SERVICE_API_URL=http://localhost:3000
PORT=3001
```
