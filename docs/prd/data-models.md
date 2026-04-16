# 数据模型总结

| 实体 | 用途 | 核心字段 |
|------|------|----------|
| Project | 顶层组织 | name, status, estimatedManDays, budgetManDays, ownerId |
| FeatureModule | 功能模块 | projectId, name, estimatedManDays, sortOrder |
| RawRequirementCollection | 原始需求收集 | projectId, title, collectionType, collectedAt |
| RawRequirement | 原始需求 | content, source, status |
| RawRequirementCollectionRequirement | 原始需求关联 | collectionId, rawRequirementId |
| Requirement | 需求 | moduleId, title, priority, estimatedManDays, storyPoints, status |
| UserStory | 用户故事 | requirementId, role, goal, benefit, storyPoints |
| AcceptanceCriteria | 验收条件 | userStoryId, content, criteriaType |
| Task | 可执行任务 | requirementId, title, assigneeType, estimatedHours, estimatedManDays |
| TaskDependency | 任务依赖 | prerequisiteTaskId, dependentTaskId |
| ProjectMember | 项目参与者 | projectId, userId, role |
| RequirementChangeLog | 变更追溯 | requirementId, changeType, oldValue, newValue |

---
**上一级**：[API设计](api-design.md)  
**返回**：[文档索引](index.md)
