---
last_updated: 2026-04-30
status: active
owner: req2task团队
---

# 实体编码规则设计

## 1. 概述

实体编码（Entity Key）是系统中各类业务实体的唯一标识符，用于直观识别和管理需求、任务等对象。

## 2. 编码格式

```
格式: {projectKey}-{type}-{sequence}
示例: PROJ-TSK-1, PROJ-TSK-2, PROJ-REQ-1
```

| 组成部分 | 说明 | 示例 |
|----------|------|------|
| projectKey | 项目唯一标识 | PROJ, MYAPP |
| type | 实体类型 | REQ, RAW, TSK |
| sequence | 自增序号 | 1, 2, 3... |

## 3. 实体类型枚举

```typescript
export enum EntityKeyType {
  REQ = 'REQ',  // 需求 (Requirement)
  RAW = 'RAW',  // 原始需求 (RawRequirement)
  TSK = 'TSK',  // 任务 (Task)
}
```

## 4. 生成逻辑

### 4.1 服务实现

**文件**: [apps/service/src/common/services/entity-key.service.ts](../../../apps/service/src/common/services/entity-key.service.ts)

```typescript
@Injectable()
export class EntityKeyService {
  async generateEntityKey(
    projectId: string,
    type: EntityKeyType,
  ): Promise<string> {
    // 1. 获取项目 projectKey
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['projectKey'],
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // 2. 构建前缀
    const prefix = `${project.projectKey}-${type}`;

    // 3. 查询当前最大序号
    const maxSeq = await this.getMaxSequence(prefix, type);

    // 4. 生成新编码
    return `${prefix}-${maxSeq + 1}`;
  }

  private async getMaxSequence(
    prefix: string,
    type: EntityKeyType,
  ): Promise<number> {
    // 根据类型选择对应 Repository
    let repository: Repository<any>;
    switch (type) {
      case EntityKeyType.REQ:
        repository = this.requirementRepository;
        break;
      case EntityKeyType.RAW:
        repository = this.rawRequirementRepository;
        break;
      case EntityKeyType.TSK:
        repository = this.taskRepository;
        break;
    }

    // 查询该前缀下的最大序号
    const result = await repository
      .createQueryBuilder('entity')
      .select(`MAX(SUBSTRING(entity.entity_key FROM ${prefix.length + 2}))`, 'maxSeq')
      .where(`entity.entity_key LIKE :prefix`, { prefix: `${prefix}-%` })
      .getRawOne();

    const maxSeq = result?.maxSeq ? parseInt(result.maxSeq, 10) : 0;
    return isNaN(maxSeq) ? 0 : maxSeq;
  }
}
```

### 4.2 使用示例

**任务创建时生成 taskNo**：[apps/service/src/tasks/tasks.service.ts](../../../apps/service/src/tasks/tasks.service.ts)

```typescript
// 获取需求关联的项目ID
const projectId = requirement.module?.projectId;

// 生成任务编号
const entityKey = await this.entityKeyService.generateEntityKey(
  projectId, 
  EntityKeyType.TSK
);

// 创建任务
const task = this.taskRepository.create({
  requirementId,
  taskNo: entityKey,      // 存储为 taskNo
  entityKey: entityKey,   // 同时存储为 entityKey
  // ... 其他字段
});
```

## 5. 数据库字段映射

| 实体 | 编码字段 | 数据库列 | 说明 |
|------|----------|----------|------|
| Requirement | entityKey | entity_key | 需求编码 |
| RawRequirement | entityKey | entity_key | 原始需求编码 |
| Task | taskNo / entityKey | task_no / entity_key | 任务编号（业务展示用 taskNo，存储双写）|

## 6. 唯一性约束

```sql
-- tasks 表
CREATE UNIQUE INDEX idx_tasks_task_no ON tasks(task_no);

-- requirements 表
CREATE UNIQUE INDEX idx_requirements_entity_key ON requirements(entity_key);

-- raw_requirements 表
CREATE UNIQUE INDEX idx_raw_requirements_entity_key ON raw_requirements(entity_key);
```

## 7. 注意事项

1. **序号连续性**：删除实体不会回收序号，保证编码唯一性
2. **并发安全**：依赖数据库唯一约束防止重复编码
3. **项目隔离**：不同项目的编码相互独立，序号从 1 开始
4. **不可修改**：编码一旦生成不可更改
