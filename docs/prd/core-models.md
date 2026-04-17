﻿# 核心模型

## 2.1 层级结构

| 层级 | 名称                           | 说明                                | 示例                                                 |
| ---- | ------------------------------ | ----------------------------------- | ---------------------------------------------------- |
| 1    | 项目 (Project)                 | 顶级容器，代表一个完整的软件系统    | 企业管理系统                                         |
| 2    | 功能模块 (Feature Module)      | 业务功能单元，包含多个相关需求      | 合同管理、用户管理                                   |
| 3    | 需求 (Requirement)             | 具体功能点，用户想要实现的功能      | 创建合同、编辑合同                                   |
| 4    | 用户故事 (User Story)          | 从用户视角描述需求的价值            | 作为销售经理，我想要创建合同以便快速签约             |
| 5    | 验收条件 (Acceptance Criteria) | 可测试的验收标准（Given-When-Then） | Given 合同信息完整，When 点击提交，Then 合同创建成功 |

## 2.2 实体关系

```
Project（项目）
    │
    ├── RawRequirementCollection（原始需求集）
    │       │
    │       └── RawRequirement（原始需求）
    │
    ├── FeatureModule（功能模块）
    │       │
    │       ├── Requirement（需求）
    │       │       │
    │       │       ├── UserStory（用户故事）
    │       │       │       │
    │       │       │       └── AcceptanceCriteria（验收条件）
    │       │       │
    │       │       └── Task（任务）
    │       │               │
    │       │               └── SubTask（子任务）
    │       │
    │       └── ProjectMember（项目成员）
    │
    ├── RequirementChangeLog（变更记录）
    └── TaskDependency（任务依赖）
```

## 2.3 实体字段定义

### Project（项目）

| 字段        | 类型     | 说明                                     |
| ----------- | -------- | ---------------------------------------- |
| id          | UUID     | 主键                                     |
| name        | string   | 项目名称                                 |
| description | string   | 项目描述                                 |
| status      | enum     | planning / active / completed / archived |
| ownerId     | UUID     | 项目负责人ID                             |
| createdAt   | datetime | 创建时间                                 |
| updatedAt   | datetime | 更新时间                                 |

### FeatureModule（功能模块）

| 字段名               | 类型        | 必填 | 说明                         | 业务规则                       |
| -------------------- | ----------- | ---- | ---------------------------- | ------------------------------ |
| id                   | UUID        | 是   | 功能模块的唯一编号           | 系统自动生成                   |
| projectId            | UUID        | 是   | 所属项目ID                   | 必须引用有效项目               |
| name                 | string(255) | 是   | 功能模块的名称               | 同一项目下不可重复             |
| description          | string      | 否   | 模块描述                     | 可选                           |
| parentModuleId       | UUID        | 否   | 支持嵌套，指向父模块         | 最多支持3层嵌套                |
| moduleType           | enum        | 是   | 系统级/业务级/功能级         | 用于区分模块层级               |
| status               | enum        | 是   | 规划中/开发中/已完成/已废弃  | 默认"规划中"                   |
| estimatedStoryPoints | integer     | 否   | 模块所有用户故事的故事点总和 | 自动计算（用户故事故事点汇总） |
| sortOrder            | integer     | 是   | 排序                         | 默认0                          |
| createdAt            | datetime    | 是   | 创建时间                     | 系统自动生成                   |
| updatedAt            | datetime    | 是   | 更新时间                     | 系统自动更新                   |

### Requirement（需求）

| 字段名              | 类型        | 必填 | 说明           | 业务规则                                |
| ------------------- | ----------- | ---- | -------------- | --------------------------------------- |
| id                  | UUID        | 是   | 需求的唯一编号 | 系统自动生成                            |
| moduleId            | UUID        | 是   | 所属功能模块ID | 必须引用有效模块                        |
| title               | string(255) | 是   | 需求标题       | 同一模块下标题不可重复                  |
| description         | string      | 是   | 需求描述       | 必须描述清楚功能点                      |
| priority            | enum        | 是   | 需求优先级     | critical / high / medium / low          |
| source              | enum        | 是   | 需求来源       | manual / ai_generated / document_import |
| status              | enum        | 是   | 需求状态       | draft / reviewed / approved / rejected / processing / completed / cancelled |
| storyPoints         | integer     | 否   | 故事点总和     | 自动计算（用户故事故事点汇总）          |
| parentRequirementId | UUID        | 否   | 父需求ID       | 支持需求分解，最多3层                   |
| createdById         | UUID        | 是   | 创建人ID       | 必须引用有效用户                        |
| createdAt           | datetime    | 是   | 创建时间       | 系统自动生成                            |
| updatedAt           | datetime    | 是   | 更新时间       | 系统自动更新                            |

### UserStory（用户故事）

| 字段          | 类型     | 说明                     |
| ------------- | -------- | ------------------------ |
| id            | UUID     | 主键                     |
| requirementId | UUID     | 关联需求ID               |
| role          | string   | 角色（如"销售经理"）     |
| goal          | string   | 目标（如"快速签约"）     |
| benefit       | string   | 价值（如"提高签约效率"） |
| createdAt     | datetime | 创建时间                 |
| updatedAt     | datetime | 更新时间                 |

### AcceptanceCriteria（验收条件）

| 字段名       | 类型        | 必填 | 说明               | 业务规则                        |
| ------------ | ----------- | ---- | ------------------ | ------------------------------- |
| id           | UUID        | 是   | 验收条件的唯一编号 | 系统自动生成                    |
| userStoryId  | UUID        | 是   | 关联用户故事ID     | 必须引用有效用户故事            |
| criteriaType | enum        | 是   | 条件类型           | functional / non_functional     |
| content      | text        | 是   | 条件内容           | Given-When-Then格式，必须可测试 |
| testMethod   | string(200) | 否   | 测试方法           | 如"手动测试"、"自动化测试"      |
| createdAt    | datetime    | 是   | 创建时间           | 系统自动生成                    |
| updatedAt    | datetime    | 是   | 更新时间           | 系统自动更新                    |

### Task（任务）

| 字段名           | 类型         | 必填 | 说明           | 业务规则                                                   |
| ---------------- | ------------ | ---- | -------------- | ---------------------------------------------------------- |
| id               | UUID         | 是   | 任务的唯一编号 | 系统自动生成                                               |
| taskNumber       | string(20)   | 是   | 任务编号       | 格式：REQ-{需求编号后4位}-TASK-{序号}，如 REQ-0001-TASK-001 |
| requirementId    | UUID         | 是   | 关联需求ID     | 必须引用有效需求                                           |
| title            | string(255)  | 是   | 任务标题       | 同一需求下标题不可重复                                     |
| description      | string       | 是   | 任务描述       | 必须描述清楚具体工作                                       |
| priority         | enum         | 是   | 任务优先级     | critical / high / medium / low                             |
| status           | enum         | 是   | 任务状态       | todo / in_progress / in_review / done / blocked / cancelled   |
| type             | enum         | 是   | 任务类型       | development / testing / documentation / deployment / other |
| assigneeType     | enum         | 是   | 负责人类型     | human / ai_agent                                           |
| assigneeId       | UUID         | 否   | 负责人ID       | 人类用户或AI机器人，分配时必填                             |
| estimatedHours   | decimal(5,2) | 否   | 预估工时       | 单位：小时，支持小数                                       |
| estimatedManDays | decimal(5,2) | 否   | 预估人天       | 自动计算：工时/8，支持小数                                 |
| actualHours      | decimal(5,2) | 否   | 实际工时       | 任务完成后填写                                             |
| actualManDays    | decimal(5,2) | 否   | 实际人天       | 自动计算：工时/8，支持小数                                 |
| isWasted         | boolean      | 是   | 是否浪费工时   | 需求/任务取消时标记为true                                  |
| cancelledReason  | string(500)  | 否   | 取消原因       | 任务取消时必填                                             |
| dueDate          | datetime     | 否   | 截止日期       | 可选，用于任务排期                                         |
| parentTaskId     | UUID         | 否   | 父任务ID       | 支持任务分解，最多3层                                      |
| createdAt        | datetime     | 是   | 创建时间       | 系统自动生成                                               |
| updatedAt        | datetime     | 是   | 更新时间       | 系统自动更新                                               |

### TaskDependency（任务依赖）

| 字段名             | 类型 | 必填 | 说明               | 业务规则                               |
| ------------------ | ---- | ---- | ------------------ | -------------------------------------- |
| id                 | UUID | 是   | 依赖关系的唯一编号 | 系统自动生成                           |
| prerequisiteTaskId | UUID | 是   | 前置任务ID         | 必须引用有效任务                       |
| dependentTaskId    | UUID | 是   | 依赖任务ID         | 必须引用有效任务，且不能与前置任务相同 |
| dependencyType     | enum | 是   | 依赖类型           | blocks / relates_to                    |

### ProjectMember（项目成员）

| 字段      | 类型     | 说明                                 |
| --------- | -------- | ------------------------------------ |
| id        | UUID     | 主键                                 |
| projectId | UUID     | 关联项目ID                           |
| userId    | UUID     | 关联用户ID                           |
| role      | enum     | owner / manager / developer / viewer |
| joinedAt  | datetime | 加入时间                             |

### RawRequirementCollection（原始需求收集）

| 字段名         | 类型        | 必填 | 说明                   | 业务规则                               |
| -------------- | ----------- | ---- | ---------------------- | -------------------------------------- |
| id             | UUID        | 是   | 原始需求收集的唯一编号 | 系统自动生成                           |
| projectId      | UUID        | 是   | 所属项目ID             | 必须引用有效项目                       |
| title          | string(255) | 是   | 收集标题               | 如"2024年Q1需求调研会议"               |
| collectionType | enum        | 是   | 收集类型               | meeting / interview / document / other |
| collectedById  | UUID        | 是   | 收集人ID               | 必须引用有效用户                       |
| collectedAt    | datetime    | 是   | 收集时间               | 需求收集的实际时间                     |
| meetingMinutes | text        | 否   | 会议纪要               | 可选，用于记录详细讨论内容             |
| createdAt      | datetime    | 是   | 创建时间               | 系统自动生成                           |
| updatedAt      | datetime    | 是   | 更新时间               | 系统自动更新                           |

### RawRequirement（原始需求）

| 字段名    | 类型        | 必填 | 说明               | 业务规则                                     |
| --------- | ----------- | ---- | ------------------ | -------------------------------------------- |
| id        | UUID        | 是   | 原始需求的唯一编号 | 系统自动生成                                 |
| content   | text        | 是   | 原始需求内容       | 客户原话或原始描述                           |
| source    | string(200) | 是   | 需求来源           | 客户姓名、文档名称等                         |
| status    | enum        | 是   | 处理状态           | pending / processing / converted / discarded |
| createdAt | datetime    | 是   | 创建时间           | 系统自动生成                                 |
| updatedAt | datetime    | 是   | 更新时间           | 系统自动更新                                 |

### RawRequirementCollectionRequirement（原始需求关联）

| 字段名           | 类型     | 必填 | 说明               | 业务规则             |
| ---------------- | -------- | ---- | ------------------ | -------------------- |
| id               | UUID     | 是   | 关联关系的唯一编号 | 系统自动生成         |
| collectionId     | UUID     | 是   | 原始需求收集ID     | 必须引用有效收集     |
| rawRequirementId | UUID     | 是   | 原始需求ID         | 必须引用有效原始需求 |
| createdAt        | datetime | 是   | 创建时间           | 系统自动生成         |

> **说明**：RawRequirement 与 RawRequirementCollection 为多对多关系，通过关联表实现。一个原始需求集可包含多条原始需求，一条原始需求也可被多个原始需求集引用。

### RequirementChangeLog（变更记录）

| 字段名        | 类型        | 必填 | 说明               | 业务规则                                 |
| ------------- | ----------- | ---- | ------------------ | ---------------------------------------- |
| id            | UUID        | 是   | 变更记录的唯一编号 | 系统自动生成                             |
| requirementId | UUID        | 是   | 关联需求ID         | 必须引用有效需求                         |
| changedById   | UUID        | 是   | 变更人ID           | 必须引用有效用户                         |
| changeType    | enum        | 是   | 变更类型           | create / update / delete / status_change |
| fieldName     | string(100) | 是   | 变更字段           | 发生变更的字段名称                       |
| oldValue      | text        | 否   | 旧值               | 变更前的值，创建操作为空                 |
| newValue      | text        | 是   | 新值               | 变更后的值                               |
| changeReason  | string(500) | 否   | 变更原因           | 可选，记录变更原因                       |
| createdAt     | datetime    | 是   | 变更时间           | 系统自动生成                             |

---

**上一级**：[系统概述](system-overview.md)  
**下一级**：[功能流程](functional-flows.md)
