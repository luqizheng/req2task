# 数据库迁移计划

## 1. 当前状态

### 1.1 现有表结构

```sql
-- 现有 user 表
CREATE TABLE "user" (
  "id" uuid PRIMARY KEY,
  "username" VARCHAR NOT NULL UNIQUE,
  "email" VARCHAR NOT NULL UNIQUE,
  "display_name" VARCHAR NOT NULL,
  "role" user_role_enum DEFAULT 'user',
  "password_hash" VARCHAR NOT NULL,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);
```

### 1.2 目标表结构

根据 [database-design.md](database-design.md)，需要创建 14 张表：
- users (重构现有)
- projects
- project_members
- feature_modules
- requirements
- user_stories
- acceptance_criteria
- tasks
- task_dependencies
- requirement_change_logs
- raw_requirement_collections
- raw_requirements
- raw_requirement_collection_requirements
- llm_configs

---

## 2. 迁移策略

### 2.1 策略选择

| 策略 | 适用场景 | 风险 | 选择 |
|------|----------|------|------|
| Big Bang | 数据量小 | 高 | - |
| Phased | 数据量大、需保持可用 | 中 | ✅ |
| Feature Toggle | 新旧系统并行 | 低 | - |

**选择**：Phased 迁移，按模块分阶段创建表

### 2.2 迁移顺序

```
Phase 1: 用户扩展
    │
    ├── users (修改现有)
    │
Phase 2: 项目基础
    │
    ├── projects
    ├── project_members
    │
Phase 3: 功能模块
    │
    ├── feature_modules
    │
Phase 4: 需求管理
    │
    ├── requirements
    ├── user_stories
    ├── acceptance_criteria
    ├── requirement_change_logs
    │
Phase 5: 任务管理
    │
    ├── tasks
    ├── task_dependencies
    │
Phase 6: 原始需求
    │
    ├── raw_requirement_collections
    ├── raw_requirements
    ├── raw_requirement_collection_requirements
    │
Phase 7: AI 能力
    │
    └── llm_configs
```

---

## 3. 迁移脚本

### Phase 1: 用户扩展

```sql
-- 迁移脚本: 001-extend-users.sql

-- 1. 添加缺失字段
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatar" VARCHAR(500);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'active';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- 2. 添加检查约束
ALTER TABLE "user" ADD CONSTRAINT chk_user_status
  CHECK (status IN ('active', 'inactive', 'deleted'));

-- 3. 重命名字段
ALTER TABLE "user" RENAME COLUMN "display_name" TO "name";

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- 5. 创建触发器
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

COMMENT ON COLUMN users.avatar IS '用户头像URL';
COMMENT ON COLUMN users.phone IS '手机号';
COMMENT ON COLUMN users.status IS '用户状态: active/inactive/deleted';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.deleted_at IS '软删除时间戳';
```

### Phase 2: 项目基础

```sql
-- 迁移脚本: 002-create-projects.sql

-- 1. 创建项目表
CREATE TABLE IF NOT EXISTS projects (
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

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;

-- 2. 创建项目成员表
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'developer', 'viewer')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- 3. 创建触发器
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_projects_updated_at();

CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_project_members_updated_at();

COMMENT ON TABLE projects IS '项目表';
COMMENT ON TABLE project_members IS '项目成员表';
```

### Phase 3: 功能模块

```sql
-- 迁移脚本: 003-create-feature-modules.sql

CREATE TABLE IF NOT EXISTS feature_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_module_id UUID REFERENCES feature_modules(id) ON DELETE SET NULL,
  module_type VARCHAR(20) NOT NULL CHECK (module_type IN ('system', 'business', 'feature')),
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'completed', 'deprecated')),
  estimated_story_points INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(project_id, name, parent_module_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_modules_project ON feature_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_modules_parent ON feature_modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_feature_modules_status ON feature_modules(status);
CREATE INDEX IF NOT EXISTS idx_feature_modules_deleted ON feature_modules(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_feature_modules_updated_at
  BEFORE UPDATE ON feature_modules
  FOR EACH ROW EXECUTE FUNCTION update_feature_modules_updated_at();

COMMENT ON TABLE feature_modules IS '功能模块表';
```

### Phase 4: 需求管理

```sql
-- 迁移脚本: 004-create-requirements.sql

-- 1. 需求表
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES feature_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'ai_generated', 'document_import')),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  story_points INTEGER DEFAULT 0,
  parent_requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  created_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(module_id, title)
);

CREATE INDEX IF NOT EXISTS idx_requirements_module ON requirements(module_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_priority ON requirements(priority);
CREATE INDEX IF NOT EXISTS idx_requirements_parent ON requirements(parent_requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirements_created_by ON requirements(created_by_id);
CREATE INDEX IF NOT EXISTS idx_requirements_deleted ON requirements(deleted_at) WHERE deleted_at IS NULL;

-- 2. 用户故事表
CREATE TABLE IF NOT EXISTS user_stories (
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

CREATE INDEX IF NOT EXISTS idx_user_stories_requirement ON user_stories(requirement_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_deleted ON user_stories(deleted_at) WHERE deleted_at IS NULL;

-- 3. 验收条件表
CREATE TABLE IF NOT EXISTS acceptance_criteria (
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

CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_user_story ON acceptance_criteria(user_story_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_type ON acceptance_criteria(criteria_type);
CREATE INDEX IF NOT EXISTS idx_acceptance_criteria_deleted ON acceptance_criteria(deleted_at) WHERE deleted_at IS NULL;

-- 4. 变更日志表
CREATE TABLE IF NOT EXISTS requirement_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'status_change', 'conflict_detected')),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT NOT NULL,
  change_reason VARCHAR(500),
  related_requirement_id UUID REFERENCES requirements(id),
  conflict_type VARCHAR(50),
  changed_by_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requirement_change_logs_requirement ON requirement_change_logs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_requirement_change_logs_type ON requirement_change_logs(change_type);
CREATE INDEX IF NOT EXISTS idx_requirement_change_logs_created ON requirement_change_logs(created_at);

-- 5. 触发器
CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION update_requirements_updated_at();

CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON user_stories
  FOR EACH ROW EXECUTE FUNCTION update_user_stories_updated_at();

CREATE TRIGGER update_acceptance_criteria_updated_at
  BEFORE UPDATE ON acceptance_criteria
  FOR EACH ROW EXECUTE FUNCTION update_acceptance_criteria_updated_at();
```

### Phase 5: 任务管理

```sql
-- 迁移脚本: 005-create-tasks.sql

-- 1. 任务表
CREATE TABLE IF NOT EXISTS tasks (
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
  CONSTRAINT chk_assignee_required CHECK (
    assignee_type = 'ai_agent' OR assignee_id IS NOT NULL
  ),
  CONSTRAINT chk_estimated_positive CHECK (estimated_hours IS NULL OR estimated_hours > 0),
  CONSTRAINT chk_actual_positive CHECK (actual_hours IS NULL OR actual_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tasks_requirement ON tasks(requirement_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_number ON tasks(task_number);

-- 2. 任务依赖表
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prerequisite_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(20) NOT NULL CHECK (dependency_type IN ('blocks', 'relates_to')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_no_self_dependency CHECK (prerequisite_task_id != dependent_task_id),
  UNIQUE(prerequisite_task_id, dependent_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_prerequisite ON task_dependencies(prerequisite_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_dependent ON task_dependencies(dependent_task_id);

-- 3. 触发器
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();

-- 4. 任务编号生成函数
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
DECLARE
  req_suffix VARCHAR(4);
  seq_num INTEGER;
BEGIN
  SELECT SUBSTRING(NEW.requirement_id::text FROM 1 FOR 4) INTO req_suffix;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(task_number FROM 'REQ-' || req_suffix || '-TASK-(\d{3})') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM tasks
  WHERE requirement_id = NEW.requirement_id
  AND task_number LIKE 'REQ-' || req_suffix || '-TASK-%';

  NEW.task_number := 'REQ-' || req_suffix || '-TASK-' || LPAD(seq_num::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_task_number_trigger
  BEFORE INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.task_number IS NULL)
  EXECUTE FUNCTION generate_task_number();
```

### Phase 6: 原始需求

```sql
-- 迁移脚本: 006-create-raw-requirements.sql

-- 1. 原始需求收集表
CREATE TABLE IF NOT EXISTS raw_requirement_collections (
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

CREATE INDEX IF NOT EXISTS idx_raw_requirement_collections_project ON raw_requirement_collections(project_id);
CREATE INDEX IF NOT EXISTS idx_raw_requirement_collections_type ON raw_requirement_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_raw_requirement_collections_collected_by ON raw_requirement_collections(collected_by_id);
CREATE INDEX IF NOT EXISTS idx_raw_requirement_collections_deleted ON raw_requirement_collections(deleted_at) WHERE deleted_at IS NULL;

-- 2. 原始需求表
CREATE TABLE IF NOT EXISTS raw_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'converted', 'discarded')),
  converted_requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_requirements_status ON raw_requirements(status);
CREATE INDEX IF NOT EXISTS idx_raw_requirements_converted ON raw_requirements(converted_requirement_id);
CREATE INDEX IF NOT EXISTS idx_raw_requirements_deleted ON raw_requirements(deleted_at) WHERE deleted_at IS NULL;

-- 3. 关联表
CREATE TABLE IF NOT EXISTS raw_requirement_collection_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES raw_requirement_collections(id) ON DELETE CASCADE,
  raw_requirement_id UUID NOT NULL REFERENCES raw_requirements(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, raw_requirement_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_req_coll_req_collection ON raw_requirement_collection_requirements(collection_id);
CREATE INDEX IF NOT EXISTS idx_raw_req_coll_req_raw_req ON raw_requirement_collection_requirements(raw_requirement_id);

-- 4. 触发器
CREATE TRIGGER update_raw_requirement_collections_updated_at
  BEFORE UPDATE ON raw_requirement_collections
  FOR EACH ROW EXECUTE FUNCTION update_raw_requirement_collections_updated_at();

CREATE TRIGGER update_raw_requirements_updated_at
  BEFORE UPDATE ON raw_requirements
  FOR EACH ROW EXECUTE FUNCTION update_raw_requirements_updated_at();
```

### Phase 7: AI 能力

```sql
-- 迁移脚本: 007-create-llm-configs.sql

CREATE TABLE IF NOT EXISTS llm_configs (
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

CREATE INDEX IF NOT EXISTS idx_llm_configs_provider ON llm_configs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_configs_is_default ON llm_configs(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_llm_configs_is_active ON llm_configs(is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_llm_configs_provider_default ON llm_configs(provider) WHERE is_default = TRUE;

CREATE TRIGGER update_llm_configs_updated_at
  BEFORE UPDATE ON llm_configs
  FOR EACH ROW EXECUTE FUNCTION update_llm_configs_updated_at();

COMMENT ON TABLE llm_configs IS 'LLM配置表';
```

---

## 4. 回滚计划

### 4.1 单个迁移回滚

```sql
-- 回滚脚本: 007-rollback-llm-configs.sql
DROP TRIGGER IF EXISTS update_llm_configs_updated_at ON llm_configs;
DROP INDEX IF EXISTS idx_llm_configs_provider_default;
DROP INDEX IF EXISTS idx_llm_configs_is_active;
DROP INDEX IF EXISTS idx_llm_configs_is_default;
DROP INDEX IF EXISTS idx_llm_configs_provider;
DROP TABLE IF EXISTS llm_configs;
```

### 4.2 完整回滚

```bash
# 按相反顺序执行回滚脚本
psql -h localhost -U postgres -d req2task -f migrations/rollback/007-rollback-llm-configs.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/006-rollback-raw-requirements.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/005-rollback-tasks.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/004-rollback-requirements.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/003-rollback-feature-modules.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/002-rollback-projects.sql
psql -h localhost -U postgres -d req2task -f migrations/rollback/001-rollback-users.sql
```

---

## 5. 数据验证

### 5.1 迁移后验证

```sql
-- 验证所有表已创建
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 验证外键
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';
```

### 5.2 完整性检查

```sql
-- 检查约束数量
SELECT COUNT(*) AS constraint_count
FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- 检查索引数量
SELECT COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public';

-- 检查触发器
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 6. 迁移执行时间估算

| Phase | 表数量 | 预估时间 | 总计 |
|-------|--------|----------|------|
| Phase 1 | 1 | 5 min | 5 min |
| Phase 2 | 2 | 10 min | 15 min |
| Phase 3 | 1 | 5 min | 20 min |
| Phase 4 | 4 | 20 min | 40 min |
| Phase 5 | 2 | 15 min | 55 min |
| Phase 6 | 3 | 15 min | 70 min |
| Phase 7 | 1 | 5 min | 75 min |

**总计**：约 1.5 小时（含回滚测试）
