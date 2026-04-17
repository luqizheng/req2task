# 产品需求文档 - 需求转任务系统（req2task）

## 实现状态总览

| 功能模块 | 状态 | 对应 Sprint | 说明 |
|----------|------|-------------|------|
| 用户与认证管理 | ✅ 已完成 | Sprint 00 | 用户 CRUD、登录认证 |
| 项目与模块管理 | ✅ 已完成 | Sprint 01-02 | Project、FeatureModule |
| 需求管理基础 | ✅ 已完成 | Sprint 03 | Requirement、UserStory、AcceptanceCriteria |
| 需求状态与变更 | ✅ 已完成 | Sprint 04 | 状态机、变更日志、评审流程 |
| 任务管理 | ✅ 已完成 | Sprint 05-06 | Task、看板视图、任务统计 |
| AI 基础设施 | ✅ 已完成 | Sprint 07 | LLM 配置、向量数据库 |
| AI 需求生成 | ✅ 已完成 | Sprint 08 | AI 生成需求、用户故事 |
| AI 冲突检测 | ✅ 已完成 | Sprint 09 | 语义检索、冲突分析、AI Chat |
| AI 增强与优化 | ✅ 已完成 | Sprint 10 | 任务分解、工时估算 |
| 高级功能 | 🚧 进行中 | Sprint 11 | 项目看板、报表、基线管理 |
| 高级功能（下） | ⏳ 待开始 | Sprint 12 | 权限完善、通知系统 |
| 需求变更处理 | ⏳ 待开始 | Sprint 15 | 任务替代/废弃、工时统计 |
| RawRequirement 关联 | ⏳ 待开始 | Sprint 14 | 原始需求关联、版本链 |

> 状态符号：✅ 已完成 | 🚧 进行中 | ⏳ 待开始 | ⚠️ 有变更

---

## 文档结构

本产品需求文档已拆分为多个模块化文件，便于维护和阅读：

### 产品定义

1. **[系统概述](system-overview.md)** - 产品定位、目标用户、核心价值、使用场景
2. **[用户管理](user-management.md)** - 用户生命周期、认证授权、角色权限、审计日志

### 业务模型

2. **[核心模型](core-models.md)** - 层级结构、实体关系、字段定义
3. **[功能流程](functional-flows.md)** - 需求创建流程、AI辅助能力、变更追溯
4. **[需求优先级管理](requirement-priority.md)** - MoSCoW方法、业务价值矩阵、依赖管理
5. **[需求版本控制](requirement-versioning.md)** - 版本管理、基线管理、回滚机制
6. **[验收标准管理](acceptance-criteria-management.md)** - 验收标准分类、测试关联、状态管理
7. **[权限与工作流](permission-workflow.md)** - 角色权限、工作流引擎、审批流程

### 技术规格

8. **[API详细设计](api-design-detailed.md)** - 完整API规范（Request/Response JSON Schema）
9. **[数据模型](data-models.md)** - 实体用途与核心字段总结

### AI能力

10. **[LLM配置管理](llm-config-prd.md)** - 多提供商LLM配置管理
11. **[提示词管理](prompt-management-prd.md)** - 提示词模板管理

## 设计文档

技术设计、实施计划等文档已移至 [设计目录](../设计/)

- [数据库设计](../设计/database-design.md) - ER图，建表语句、索引策略
- [模块详细设计](../设计/module-design.md) - 代码组织、接口定义
- [AI辅助需求分析](../设计/ai-assistant-design.md) - RAG检索、冲突检测、上下文关联
- [实施路线图](../设计/implementation-plan.md) - Sprint 规划、里程碑、资源分配
- [数据库迁移计划](../设计/database-migration.md) - 迁移脚本、回滚计划

## 文档版本

| 版本 | 日期       | 变更说明                                               |
| ---- | ---------- | ------------------------------------------------------ |
| v1.0 | 2024-01-01 | 初始版本                                               |
| v1.1 | 2024-01-15 | 添加原始需求模型                                       |
| v1.2 | 2024-02-01 | 拆分文档结构                                           |
| v2.0 | 2026-04-16 | 补充技术设计、实施路线图                               |
| v2.1 | 2026-04-16 | 需求状态增加processing/completed、设计文档移至独立目录 |
| v2.2 | 2026-04-17 | 新增用户管理系统PRD                                    |

## 维护说明

- PRD 文档位于 `docs/prd/` 目录
- 设计文档位于 `docs/设计/` 目录
- 主索引文件：`index.md`
- 各模块独立文件，便于单独更新
- 遵循 [文档编写规则](../agents.md) 规范

## 快速导航

- [系统概述](system-overview.md)
- [用户管理](user-management.md)
- [项目成员系统](project-user-system.md)
- [核心模型](core-models.md)
- [功能流程](functional-flows.md)
- [需求优先级管理](requirement-priority.md)
- [需求版本控制](requirement-versioning.md)
- [验收标准管理](acceptance-criteria-management.md)
- [权限与工作流](permission-workflow.md)
- [API详细设计](api-design-detailed.md)
- [数据模型](data-models.md)
