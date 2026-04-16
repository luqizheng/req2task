---
last_updated: 2026-04-17
status: active
owner: req2task团队
---

# 系统架构概述

## 1. 技术栈

- **包管理器**: pnpm@9.0.0
- **前端**: Vue 3 + Vite + Pinia + Vue Router
- **后端**: NestJS + TypeORM + PostgreSQL
- **缓存**: Redis
- **向量数据库**: ChromaDB
- **AI**: DeepSeek / OpenAI / Ollama / MiniMax
- **语言**: TypeScript

## 2. 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端展示层 (Web - apps/web)               │
├─────────────────────────────────────────────────────────────────┤
│  项目看板  │  需求管理  │  任务跟踪  │  AI助手  │  报表中心     │
└──────┬─────────────────────────────────────────────────────────┘
       │ HTTP/WebSocket
┌──────▼─────────────────────────────────────────────────────────┐
│                     API层 (apps/service)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              NestJS Modules                              │   │
│  │  auth │ users │ projects │ requirements │ tasks │ AI  │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────┬─────────────────────────────────────────────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│                     数据层                                      │
├──────────┬──────────┬──────────┬──────────────────────────────┤
│ PostgreSQL│  Redis   │ ChromaDB │ LLM Providers                │
│  数据库    │  缓存    │ 知识库    │ DeepSeek/OpenAI/Ollama     │
└──────────┴──────────┴──────────┴──────────────────────────────┘
```

## 3. Monorepo 结构

```
req2task/
├── apps/
│   ├── web/           # Vue 3 前端
│   └── service/       # NestJS 后端
├── packages/
│   ├── core/          # 后端核心业务代码（实体、服务）
│   └── dto/           # 前后端共享 DTO 定义
├── docs/              # 项目文档
│   ├── architecture/  # 架构文档
│   ├── conventions/   # 规范文档
│   ├── design/        # 设计文档
│   ├── prd/           # PRD 文档
│   ├── plans/         # 计划文档
│   └── reference/     # 参考文档
└── .agents/           # Agent 配置和规则
```

## 4. 模块依赖关系

```
           ┌─────────┐
           │  Auth   │
           └────┬────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Users  │  │Projects │  │  LLM   │
└────────┘  └────┬───┘  └────┬───┘
                  │           │
         ┌────────┼───────────┤
         │        │           │
         ▼        ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │FeatureM │ │  AI   │ │  AI   │
    │ odules  │ │ Search│ │Generate│
    └────┬────┘ └────────┘ └────────┘
         │
         ▼
    ┌────────────────┐
    │  Requirements  │
    └───────┬────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌────────┐ ┌──────┐ ┌────────┐
│UserStor│ │Tasks │ │RawReq  │
└────────┘ └──┬───┘ └────────┘
              │
              ▼
         ┌────────┐
         │SubTasks│
         └────────┘
```

## 5. 核心模块职责

| 模块 | 职责边界 | 核心能力 |
|------|----------|----------|
| 项目管理 | 项目生命周期控制 | 创建/配置/归档项目、管理成员、权限分配 |
| 需求管理 | 需求全生命周期 | 原始需求收集、结构化转换、评审审批、版本控制 |
| 任务管理 | 任务执行跟踪 | 任务分解、分配、状态流转、依赖管理 |
| AI服务 | 智能辅助决策 | 需求生成、任务拆解、工作估算、相似推荐 |
| 变更追溯 | 变更全程记录 | 变更日志、版本对比、影响分析、基线管理 |
| 验收管理 | 质量把控 | 验收条件定义、测试关联、执行跟踪 |
| 报表中心 | 数据可视化 | 进度看板、燃尽图、趋势分析 |

## 6. 数据库表结构

| 实体 | 用途 | 核心字段 |
|------|------|----------|
| Project | 顶层组织 | name, status, estimatedManDays, budgetManDays, ownerId |
| FeatureModule | 功能模块 | projectId, name, estimatedManDays, sortOrder |
| RawRequirementCollection | 原始需求收集 | projectId, title, collectionType, collectedAt |
| RawRequirement | 原始需求 | content, source, status |
| Requirement | 需求 | moduleId, title, priority, estimatedManDays, storyPoints, status |
| UserStory | 用户故事 | requirementId, role, goal, benefit, storyPoints |
| AcceptanceCriteria | 验收条件 | userStoryId, content, criteriaType |
| Task | 可执行任务 | requirementId, title, assigneeType, estimatedHours, estimatedManDays |
| TaskDependency | 任务依赖 | prerequisiteTaskId, dependentTaskId |
| ProjectMember | 项目参与者 | projectId, userId, role |
| RequirementChangeLog | 变更追溯 | requirementId, changeType, oldValue, newValue |

## 7. 全局命令

```bash
pnpm dev:web        # 启动前端开发服务器
pnpm dev:service    # 启动后端开发服务器
pnpm dev:infra      # 启动开发基础设施服务
pnpm dev:infra:stop # 停止开发基础设施服务
pnpm build          # 构建所有应用
pnpm lint           # 检查所有代码
pnpm test           # 运行所有测试
```
