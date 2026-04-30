# Requirement 与 Module 数据结构重构计划

## 目标

1. Requirement 与 Module 改为多对多关系
2. Module 新增字段：aliases、keywords、path
3. moduleKey 用于生成编译编号

## 当前状态

### Requirement 实体

* `moduleId`: string | null - 单模块关联（ManyToOne）

* `moduleIds`: string\[] | null - simple-array 存储多模块ID

### FeatureModule 实体

* `moduleKey`: string - 已存在，用于模块标识

* 树形结构：parentId, parent, children

## 变更内容

### 1. 实体层修改 (packages/core)

#### feature-module.entity.ts

新增字段：

```typescript
@Column({ type: 'jsonb', nullable: true })
aliases!: string[] | null;  // 别名列表，如 ["用户认证", "身份验证"]

@Column({ type: 'jsonb', nullable: true })
keywords!: string[] | null; // 关键词列表，如 ["登录", "注册", "鉴权"]

@Column({ type: 'text', nullable: true })
path!: string | null;       // 完整路径，如 "系统设置 / 权限管理 / 角色分配"
```

#### requirement.entity.ts

修改关联关系：

```typescript
// 删除以下字段
// moduleId: string | null
// moduleIds: string[] | null
// module: FeatureModule | null

// 新增多对多关系
@ManyToMany(() => FeatureModule, (module) => module.requirements, { onDelete: 'CASCADE' })
@JoinTable({
  name: 'requirement_modules',
  joinColumn: { name: 'requirement_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'module_id', referencedColumnName: 'id' }
})
modules!: FeatureModule[];
```

#### 新增关联实体 (可选，如需额外字段)

若关联需要排序等额外属性，创建 requirement-module.entity.ts

### 2. DTO 层修改 (packages/dto)

#### feature-module.dto.ts

```typescript
// CreateFeatureModuleDto / UpdateFeatureModuleDto 新增
aliases?: string[];
keywords?: string[];
path?: string;

// FeatureModuleResponseDto 新增
aliases!: string[] | null;
keywords!: string[] | null;
path!: string | null;
```

#### requirement.dto.ts

```typescript
// CreateRequirementDto 修改
// moduleIds?: string[]; → 保持，但含义变为多模块

// RequirementResponseDto 修改
// moduleId!: string | null; → 删除
// moduleIds!: string[] | null; → 改为 modules: ModuleSummaryDto[]

// 新增 ModuleSummaryDto
class ModuleSummaryDto {
  id!: string;
  name!: string;
  moduleKey!: string;
  path!: string | null;
}
```

### 3. 服务层修改 (apps/service)

#### feature-modules.service.ts

* create/update: 处理 aliases, keywords, path 字段

* toResponseDto: 包含新字段

#### requirements.service.ts

* create: 使用 repository.manager 或 QueryBuilder 建立多对多关联

* findByModule: 改为通过关联表查询

* findByProject: 改为通过 modules 关联查询

* update: 处理模块关联变更

* toResponseDto: 返回 modules 数组而非 moduleIds

### 4. 数据库迁移

创建新迁移文件：

```typescript
// 1. 给 feature_modules 表添加列
ALTER TABLE feature_modules ADD COLUMN aliases jsonb;
ALTER TABLE feature_modules ADD COLUMN keywords jsonb;
ALTER TABLE feature_modules ADD COLUMN path text;

// 2. 创建关联表
CREATE TABLE requirement_modules (
    requirement_id uuid NOT NULL,
    module_id uuid NOT NULL,
    CONSTRAINT PK_requirement_modules PRIMARY KEY (requirement_id, module_id)
);
CREATE INDEX idx_requirement_modules_requirement_id ON requirement_modules(requirement_id);
CREATE INDEX idx_requirement_modules_module_id ON requirement_modules(module_id);
ALTER TABLE requirement_modules ADD CONSTRAINT FK_requirement_modules_requirement 
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE;
ALTER TABLE requirement_modules ADD CONSTRAINT FK_requirement_modules_module 
    FOREIGN KEY (module_id) REFERENCES feature_modules(id) ON DELETE CASCADE;

// 3. 数据迁移：将现有 module_ids 数据迁移到关联表
// 解析 module_ids (simple-array) 并插入到 requirement_modules

// 4. 删除旧字段
ALTER TABLE requirements DROP COLUMN module_id;
ALTER TABLE requirements DROP COLUMN module_ids;
```

### 5. path 字段计算逻辑

在 FeatureModulesService 中添加：

```typescript
private async calculatePath(module: FeatureModule): Promise<string> {
  const paths: string[] = [module.name];
  let current = module;
  while (current.parentId) {
    current = await this.featureModuleRepository.findOne({ where: { id: current.parentId } });
    if (current) {
      paths.unshift(current.name);
    }
  }
  return paths.join(' / ');
}
```

在 create/update 时自动计算并存储 path。

## 实施步骤

1. **修改 FeatureModule 实体** - 添加 aliases, keywords, path 字段
2. **修改 FeatureModule DTO** - 更新 Create/Update/Response DTO
3. **修改 FeatureModule Service** - 处理新字段，实现 path 自动计算
4. **创建 Requirement-Module 关联表实体** (如需要)
5. **修改 Requirement 实体** - 改为 ManyToMany 关系
6. **修改 Requirement DTO** - 更新相关 DTO
7. **修改 Requirement Service** - 使用新的多对多关系
8. **生成并编写迁移文件** - 数据库结构变更
9. **运行测试验证**

## 注意事项

1. moduleKey 已存在，无需新增，用于生成编译编号
2. path 字段通过遍历 parent 链自动计算并缓存
3. aliases 和 keywords 使用 jsonb 存储字符串数组
4. Requirement 与 Module 的多对多使用显式关联表
5. 迁移时需处理现有 module\_ids 数据

## 文件变更清单

### packages/core/src/entities/

* feature-module.entity.ts (修改)

* requirement.entity.ts (修改)

### packages/dto/src/project/dto/

* feature-module.dto.ts (修改)

### packages/dto/src/requirement/dto/

* requirement.dto.ts (修改)

### apps/service/src/feature-modules/

* feature-modules.service.ts (修改)

* feature-modules.controller.ts (可能需调整)

### apps/service/src/requirements/

* requirements.service.ts (修改)

* requirements.controller.ts (可能需调整)

### apps/service/src/migrations/

* 新建迁移文件 (如 1778xxxxxx-modify-requirement-module-relation.ts)

