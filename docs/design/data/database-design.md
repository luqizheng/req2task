---
last_updated: 2025-04-30
status: active
owner: req2task团队
---

# 数据库设计

## 1. ER 图

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│      User       │────▶│    ProjectMembership      │◀────│     Project      │
└─────────────────┘     └──────────────────────────┘     └────────┬────────┘
                                                                   │
                              ┌───────────────────────────────────┼───────────────────────────────────┐
                              │                                   │                                   │
                              ▼                                   ▼                                   ▼
                    ┌─────────────────┐                 ┌─────────────────┐                 ┌──────────────────────────┐
                    │ FeatureModule   │                 │  RawRequirement │                 │  RequirementChangeLog    │
                    │ (功能模块)       │                 │  Collection      │                 │  (变更记录)              │
                    └────────┬────────┘                 │  (原始需求收集)   │                 └──────────────────────────┘
                             │                           └────────┬────────┘
                             │                                    │
                             │                                    ▼
                             │                          ┌──────────────────────────┐
                             │                          │   RawRequirement         │
                             │                          │   (原始需求)              │
                             │                          └──────────────────────────┘
                             │
                             │◀──────────────────┐
                             │                   │
                             │    ┌──────────────┴───────────┐
                             │    │  Requirement_Modules     │
                             │    │  (需求-模块关联表)        │
                             │    │  (ManyToMany)            │
                             │    └──────────────┬───────────┘
                             │                   │
                             ▼                   ▼
                    ┌─────────────────┐   ┌─────────────────┐
                    │   Requirement   │   │   Requirement   │
                    │   (需求)         │   │   (父需求)      │
                    └────────┬────────┘   └─────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  UserStory  │   │    Task     │   │ Acceptance  │
   │  (用户故事)  │   │   (任务)     │   │  Criteria   │
   └──────┬──────┘   └──────┬──────┘   │ (验收条件)   │
          │                  │          └─────────────┘
          ▼                  ▼
   ┌─────────────┐   ┌─────────────┐
   │ Acceptance   │   │    SubTask  │
   │ Criteria    │   │   (子任务)   │
   │ (验收条件)   │   └──────┬──────┘
   └─────────────┘          │
                            ▼
                   ┌─────────────────┐
                   │TaskDependency   │
                   │ (任务依赖)      │
                   └─────────────────┘
```

**关键变更说明：**
- Requirement 与 FeatureModule 改为 **多对多关系**，通过 `requirement_modules` 关联表实现
- 一个需求可关联多个模块，也可不关联任何模块（模块非必填）
- FeatureModule 新增 `aliases`、`keywords`、`path`、`module_key` 字段，支持 LLM 匹配和层级路径展示

---

## 2. 表结构

### 2.1 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 2.2 项目表 (projects)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'archived')),
  estimated_man_days DECIMAL(10,2),
  budget_man_days DECIMAL(10,2),
  actual_man_days DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;
```

### 2.3 项目成员表 (project_members)

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'developer', 'viewer')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);
```

### 2.4 功能模块表 (feature_modules)

```sql
CREATE TABLE feature_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- 模块唯一标识，用于生成编译编号
  module_key VARCHAR(100) NOT NULL,
  -- 别名列表（JSONB），如 ["用户认证", "身份验证"]
  aliases JSONB,
  -- 关键词列表（JSONB），如 ["登录", "注册", "鉴权"]
  keywords JSONB,
  -- 完整路径，如 "系统设置 / 权限管理 / 角色分配"
  path TEXT,
  parent_id UUID REFERENCES feature_modules(id) ON DELETE SET NULL,
  sort INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(project_id, module_key),
  UNIQUE(project_id, name, parent_id)
);

CREATE INDEX idx_feature_modules_project ON feature_modules(project_id);
CREATE INDEX idx_feature_modules_parent ON feature_modules(parent_id);
CREATE INDEX idx_feature_modules_path ON feature_modules(path);
CREATE INDEX idx_feature_modules_deleted ON feature_modules(deleted_at) WHERE deleted_at IS NULL;

-- GIN 索引用于 JSONB 字段查询
CREATE INDEX idx_feature_modules_aliases ON feature_modules USING GIN (aliases);
CREATE INDEX idx_feature_modules_keywords ON feature_modules USING GIN (keywords);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| module_key | VARCHAR(100) | 模块唯一标识，用于生成编译编号（如 AUTH-001） |
| aliases | JSONB | 别名列表，便于 LLM 理解模块语义 |
| keywords | JSONB | 关键词列表，用于 LLM 匹配需求归属 |
| path | TEXT | 从根节点到当前模块的完整路径 |
| sort | INTEGER | 同级模块排序顺序 |

### 2.5 需求-模块关联表 (requirement_modules)

```sql
CREATE TABLE requirement_modules (
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES feature_modules(id) ON DELETE CASCADE,
  PRIMARY KEY (requirement_id, module_id)
);

CREATE INDEX idx_requirement_modules_requirement ON requirement_modules(requirement_id);
CREATE INDEX idx_requirement_modules_module ON requirement_modules(module_id);
```

**说明：** Requirement 与 FeatureModule 的多对多关联表，一个需求可关联多个模块，也可不关联任何模块（模块非必填）。

### 2.6 需求表 (requirements)

```sql
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  key_elements TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'ai_generated', 'document_import')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  story_points INTEGER DEFAULT 0,
  parent_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  source_raw_requirement_id UUID REFERENCES raw_requirements(id) ON DELETE SET NULL,
  conversation_id UUID,
  review_chain_id UUID,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requirements_entity_key ON requirements(entity_key);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_priority ON requirements(priority);
CREATE INDEX idx_requirements_parent ON requirements(parent_id);
CREATE INDEX idx_requirements_created_by ON requirements(created_by_id);
```

**变更说明：**
- ~~已删除：module_id 字段~~
- ~~已删除：module_ids 字段（simple-array）~~
- 新增：通过 `requirement_modules` 表实现多对多关联
- 新增：entity_key 字段，用于业务编号

### 2.7 用户故事表 (user_stories)

```sql
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  role VARCHAR(100) NOT NULL,
  goal VARCHAR(255) NOT NULL,
  benefit VARCHAR(500) NOT NULL,
  story_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_user_stories_requirement ON user_stories(requirement_id);
CREATE INDEX idx_user_stories_deleted ON user_stories(deleted_at) WHERE deleted_at IS NULL;
```

### 2.8 验收条件表 (acceptance_criteria)

```sql
CREATE TABLE acceptance_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  criteria_type VARCHAR(20) NOT NULL CHECK (criteria_type IN ('functional', 'non_functional')),
  content TEXT NOT NULL,
  test_method VARCHAR(200),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'pass', 'fail')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_acceptance_criteria_user_story ON acceptance_criteria(user_story_id);
CREATE INDEX idx_acceptance_criteria_type ON acceptance_criteria(criteria_type);
CREATE INDEX idx_acceptance_criteria_deleted ON acceptance_criteria(deleted_at) WHERE deleted_at IS NULL;
```

### 2.9 任务表 (tasks)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number VARCHAR(30) NOT NULL UNIQUE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('development', 'testing', 'documentation', 'deployment', 'other')),
  assignee_type VARCHAR(20) NOT NULL CHECK (assignee_type IN ('human', 'ai_agent')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  estimated_hours DECIMAL(10,2),
  estimated_man_days DECIMAL(10,2) GENERATED ALWAYS AS (estimated_hours / 8) STORED,
  actual_hours DECIMAL(10,2),
  actual_man_days DECIMAL(10,2) GENERATED ALWAYS AS (actual_hours / 8) STORED,
  is_wasted BOOLEAN DEFAULT FALSE,
  cancelled_reason VARCHAR(500),
  due_date TIMESTAMP,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT chk_task_nesting CHECK (
    parent_task_id IS NULL OR (
      SELECT COUNT(*) FROM tasks t2
      WHERE t2.id = tasks.parent_task_id
      AND t2.parent_task_id IS NOT NULL
    ) < 2
  ),
  CONSTRAINT chk_estimated_positive CHECK (estimated_hours IS NULL OR estimated_hours > 0),
  CONSTRAINT chk_actual_positive CHECK (actual_hours IS NULL OR actual_hours >= 0),
  CONSTRAINT chk_assignee_required CHECK (
    assignee_type = 'ai_agent' OR assignee_id IS NOT NULL
  ),
  UNIQUE(requirement_id, title)
);

CREATE INDEX idx_tasks_requirement ON tasks(requirement_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_deleted ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_number ON tasks(task_number);
```

### 2.10 任务依赖表 (task_dependencies)

```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prerequisite_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) NOT NULL CHECK (dependency_type IN ('blocks', 'relates_to')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_no_self_dependency CHECK (prerequisite_task_id != dependent_task_id),
  UNIQUE(prerequisite_task_id, dependent_task_id)
);

CREATE INDEX idx_task_dependencies_prerequisite ON task_dependencies(prerequisite_task_id);
CREATE INDEX idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);
```

### 2.11 需求变更日志表 (requirement_change_logs)

```sql
CREATE TABLE requirement_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'status_change')),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT NOT NULL,
  change_reason VARCHAR(500),
  changed_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requirement_change_logs_requirement ON requirement_change_logs(requirement_id);
CREATE INDEX idx_requirement_change_logs_type ON requirement_change_logs(change_type);
CREATE INDEX idx_requirement_change_logs_created ON requirement_change_logs(created_at);
```

### 2.12 原始需求收集表 (raw_requirement_collections)

```sql
CREATE TABLE raw_requirement_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  collection_type VARCHAR(20) NOT NULL CHECK (collection_type IN ('meeting', 'interview', 'document', 'other')),
  meeting_minutes TEXT,
  collected_by_id UUID NOT NULL REFERENCES users(id),
  collected_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_raw_requirement_collections_project ON raw_requirement_collections(project_id);
CREATE INDEX idx_raw_requirement_collections_type ON raw_requirement_collections(collection_type);
CREATE INDEX idx_raw_requirement_collections_collected_by ON raw_requirement_collections(collected_by_id);
CREATE INDEX idx_raw_requirement_collections_deleted ON raw_requirement_collections(deleted_at) WHERE deleted_at IS NULL;
```

### 2.13 原始需求表 (raw_requirements)

```sql
CREATE TABLE raw_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'converted', 'discarded')),
  converted_requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_raw_requirements_status ON raw_requirements(status);
CREATE INDEX idx_raw_requirements_converted ON raw_requirements(converted_requirement_id);
CREATE INDEX idx_raw_requirements_deleted ON raw_requirements(deleted_at) WHERE deleted_at IS NULL;
```

### 2.14 原始需求关联表 (raw_requirement_collection_requirements)

```sql
CREATE TABLE raw_requirement_collection_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES raw_requirement_collections(id) ON DELETE CASCADE,
  raw_requirement_id UUID NOT NULL REFERENCES raw_requirements(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, raw_requirement_id)
);

CREATE INDEX idx_raw_req_coll_req_collection ON raw_requirement_collection_requirements(collection_id);
CREATE INDEX idx_raw_req_coll_req_raw_req ON raw_requirement_collection_requirements(raw_requirement_id);
```

### 2.15 LLM 配置表 (llm_configs)

```sql
CREATE TABLE llm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('deepseek', 'openai', 'ollama', 'minimax')),
  model_id VARCHAR(100) NOT NULL,
  api_key TEXT NOT NULL,
  api_endpoint VARCHAR(500) NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER,
  timeout INTEGER DEFAULT 30000,
  max_retries INTEGER DEFAULT 3,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_llm_configs_provider ON llm_configs(provider);
CREATE INDEX idx_llm_configs_is_default ON llm_configs(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_llm_configs_is_active ON llm_configs(is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_llm_configs_provider_default ON llm_configs(provider) WHERE is_default = TRUE;
CREATE UNIQUE INDEX idx_llm_configs_name_provider ON llm_configs(name, provider);
```

---

## 3. 索引策略

### 3.1 主键索引
- 所有表主键默认创建 B-tree 索引

### 3.2 外键索引
| 外键 | 索引名称 | 说明 |
|------|----------|------|
| projects.owner_id | idx_projects_owner | 项目查询 |
| project_members.project_id | idx_project_members_project | 成员查询 |
| feature_modules.project_id | idx_feature_modules_project | 模块查询 |
| ~~requirements.module_id~~ | ~~idx_requirements_module~~ | ~~已删除~~ |
| requirement_modules.requirement_id | idx_requirement_modules_requirement | 需求-模块关联查询 |
| requirement_modules.module_id | idx_requirement_modules_module | 模块需求查询 |
| user_stories.requirement_id | idx_user_stories_requirement | 用户故事查询 |
| tasks.requirement_id | idx_tasks_requirement | 任务查询 |
| tasks.assignee_id | idx_tasks_assignee | 分配查询 |

### 3.3 业务索引
| 字段 | 索引类型 | 用途 |
|------|----------|------|
| projects.status | B-tree | 状态过滤 |
| projects.deleted_at | Partial | 软删除查询 |
| feature_modules.aliases | GIN | LLM 别名匹配 |
| feature_modules.keywords | GIN | LLM 关键词匹配 |
| feature_modules.path | B-tree | 层级路径查询 |
| requirements.status | B-tree | 状态流转 |
| requirements.priority | B-tree | 优先级排序 |
| requirements.entity_key | B-tree | 业务编号查询 |
| tasks.status | B-tree | 看板视图 |
| tasks.due_date | B-tree | 逾期提醒 |

### 3.4 唯一索引
| 约束 | 字段 | 说明 |
|------|------|------|
| UNIQUE | users.email | 邮箱唯一 |
| UNIQUE | projects.name | 项目名唯一 |
| UNIQUE | feature_modules.module_key (project_id) | 项目内模块标识唯一 |
| UNIQUE | requirements.entity_key | 需求业务编号唯一 |
| UNIQUE | tasks.task_number | 任务编号唯一 |
| UNIQUE | project_members(project_id, user_id) | 成员不重复 |
| UNIQUE | llm_configs(provider) WHERE is_default | 每提供商一个默认 |

---

## 4. 约束规则

### 4.1 嵌套层级约束
- 需求嵌套：最多 3 层（parent_requirement_id 链最多 2 次）
- 任务嵌套：最多 3 层（parent_task_id 链最多 2 次）
- 模块嵌套：最多 3 层（parent_module_id 链最多 2 次）

### 4.2 业务约束
```sql
-- 任务必须有负责人（AI任务除外）
CONSTRAINT chk_assignee_required CHECK (
  assignee_type = 'ai_agent' OR assignee_id IS NOT NULL
);

-- 工时必须为正
CONSTRAINT chk_estimated_positive CHECK (estimated_hours IS NULL OR estimated_hours > 0);
CONSTRAINT chk_actual_positive CHECK (actual_hours IS NULL OR actual_hours >= 0);

-- 不能自依赖
CONSTRAINT chk_no_self_dependency CHECK (prerequisite_task_id != dependent_task_id);

-- 模块在项目内唯一标识
CONSTRAINT uq_feature_modules_project_key UNIQUE (project_id, module_key);
```

---

## 5. 软删除策略

所有业务表包含 `deleted_at` 字段：
- 删除时设置 `deleted_at = CURRENT_TIMESTAMP`
- 查询时自动过滤 `WHERE deleted_at IS NULL`
- 使用 PostgreSQL Partial Index 优化

---

## 6. 命名规范

| 规范 | 示例 |
|------|------|
| 表名单数 | user, project, requirement |
| 字段蛇形 | task_number, created_at |
| 索引命名 | idx_{table}_{column} |
| 触发器命名 | update_{table}_updated_at |
| 外键命名 | fk_{table}_{ref_table} |

---

## 7. 数据结构变更日志

### 2025-04-30 Requirement-Module 关系重构

**变更内容：**
1. **feature_modules 表新增字段**
   - `module_key` (VARCHAR): 模块唯一标识，用于生成编译编号
   - `aliases` (JSONB): 别名列表，如 `["用户认证", "身份验证"]`
   - `keywords` (JSONB): 关键词列表，如 `["登录", "注册", "鉴权"]`
   - `path` (TEXT): 完整路径，如 `"系统设置 / 权限管理 / 角色分配"`

2. **requirements 表结构变更**
   - ~~删除 `module_id` 字段~~
   - ~~删除 `module_ids` 字段（simple-array）~~
   - 新增 `entity_key` 字段（业务编号）
   - 通过 `requirement_modules` 关联表实现多对多关系

3. **新增关联表 requirement_modules**
   - 字段：`requirement_id`, `module_id`
   - 主键：联合主键 (requirement_id, module_id)

**迁移脚本：** [1777564000000-modify-requirement-module-relation.ts](../../../apps/service/src/migrations/1777564000000-modify-requirement-module-relation.ts)
