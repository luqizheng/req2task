---
last_updated: 2026-04-17
status: active
owner: req2task团队
---

# 文档索引

## 快速导航

| 你想做什么 | 去哪里看 |
|-----------|---------|
| 了解系统架构 | [docs/architecture/overview.md](architecture/overview.md) |
| 了解模块边界和依赖规则 | [docs/design/module-design.md](design/module-design.md) |
| 了解编码规范 | [.agents/rules/dev-rules.md](../.agents/rules/dev-rules.md) |
| 了解 API 规范 | [docs/reference/api-spec.md](reference/api-spec.md) |
| 了解数据库设计 | [docs/design/database-design.md](design/database-design.md) |
| 了解 AI 能力设计 | [docs/design/ai-assistant-design.md](design/ai-assistant-design.md) |
| 了解实施计划 | [docs/design/implementation-plan.md](design/implementation-plan.md) |
| **文档管理规则** | [docs/DOCS_MANAGEMENT.md](DOCS_MANAGEMENT.md) |

## 文档层级

### architecture/ - 架构层（稳定，很少变更）

| 文档 | 说明 | 状态 |
|------|------|------|
| [overview.md](architecture/overview.md) | 系统整体架构图和技术栈说明 | ✅ 实现中 |
| [system-overview.md](architecture/system-overview.md) | 产品定位、目标用户、核心价值 | ✅ 已实现 |
| [data-flow.md](architecture/data-flow.md) | 数据流转图和模块交互 | 📋 规划中 |

### conventions/ - 规范层（偶尔更新）

| 文档 | 说明 | 状态 |
|------|------|------|
| [naming.md](conventions/naming.md) | TypeScript/Vue/API 命名规范 | ✅ 已实现 |
| [error-handling.md](conventions/error-handling.md) | 错误处理规范 | 📋 规划中 |
| [logging.md](conventions/logging.md) | 日志规范 | 📋 规划中 |

### design/ - 设计层（按功能组织）

| 文档 | 说明 | 状态 |
|------|------|------|
| [database-design.md](design/database-design.md) | ER图、建表语句、索引策略 | ✅ 已实现 |
| [module-design.md](design/module-design.md) | 代码组织、模块设计 | ✅ 已实现 |
| [ai-assistant-design.md](design/ai-assistant-design.md) | RAG检索、冲突检测、上下文关联 | ✅ 已实现 |
| [implementation-plan.md](design/implementation-plan.md) | Sprint规划、里程碑、资源分配 | ✅ 已实现 |
| [llm-management.md](design/llm-management.md) | LLM配置管理、提示词管理 | ✅ 已实现 |

### prd/ - 产品需求层

| 文档 | 说明 | 状态 |
|------|------|------|
| [core-models.md](prd/core-models.md) | 层级结构、实体关系、字段定义 | ✅ 已实现 |
| [functional-flows.md](prd/functional-flows.md) | 需求创建流程、AI辅助能力 | ✅ 已实现 |
| [requirement-priority.md](prd/requirement-priority.md) | MoSCoW方法、优先级计算 | ✅ 已实现 |
| [requirement-versioning.md](prd/requirement-versioning.md) | 版本管理、基线管理、回滚机制 | ✅ 已实现 |
| [acceptance-criteria-management.md](prd/acceptance-criteria-management.md) | 验收标准分类、测试关联 | ✅ 已实现 |
| [permission-workflow.md](prd/permission-workflow.md) | 角色权限、工作流引擎、审批流程 | ✅ 已实现 |
| [non-functional-requirements.md](prd/non-functional-requirements.md) | 性能、安全、可用性需求 | ✅ 已实现 |

### plans/ - 计划层（频繁变更）

| 文档 | 说明 | 状态 |
|------|------|------|
| [current-sprint.md](plans/current-sprint.md) | 当前迭代任务 | 📋 规划中 |
| [backlog.md](plans/backlog.md) | 待办事项 | 📋 规划中 |

### manuals/ - 用户手册层

| 文档 | 说明 | 状态 |
|------|------|------|
| [index.md](manuals/index.md) | 用户手册索引 | ✅ 已实现 |
| [project-management.md](manuals/project-management.md) | 项目管理指南 | ✅ 已实现 |
| [user-management.md](manuals/user-management.md) | 用户管理指南 | ✅ 已实现 |
| [admin-permissions.md](manuals/admin-permissions.md) | 管理员权限说明 | ✅ 已实现 |

### reference/ - 参考层（自动生成）

| 文档 | 说明 | 状态 |
|------|------|------|
| [api-spec.md](reference/api-spec.md) | API 规范文档 | ✅ 已实现 |
| [error-codes.md](reference/error-codes.md) | 错误码定义 | 📋 规划中 |

## 硬性规则

1. **单文件行数限制**：.ts/.tsx ≤ 300行，.vue ≤ 500行，.spec.ts ≤ 2300行
2. **新增代码必须有对应测试**
3. **使用结构化日志，禁止 console.log**
4. **Web/Service 交互的 DTO 必须定义在 packages/dto 中**

## 文档维护

- 每次更新文档时更新 `last_updated` 日期
- 状态说明：✅ 已实现、📋 规划中、🔄 进行中
- 新增文档时在此索引中添加条目
