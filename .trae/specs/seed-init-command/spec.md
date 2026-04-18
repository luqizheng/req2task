# 初始化数据命令 Spec

## Why
系统需要初始化基础数据（项目、需求、LLM配置），以便开发环境和演示使用。

## What Changes
- 创建 NestJS CLI 命令 `seed:run` 用于初始化数据库基础数据
- 添加 req2task 项目及功能模块
- 添加项目相关的需求和原始需求
- 添加 ollama LLM 配置（qwen6:8b 模型）

## Impact
- Affected specs: 需求管理、LLM配置管理
- Affected code:
  - `apps/service/src/commands/` - 新增 seed 命令
  - `apps/service/src/commands/seed/` - seed 相关文件

## ADDED Requirements

### Requirement: Seed 命令
系统应提供 CLI 命令 `pnpm seed` 来初始化数据库基础数据。

#### Scenario: 运行 seed 命令
- **WHEN** 开发者运行 `pnpm seed`
- **THEN** 系统创建 req2task 项目、相关功能模块、需求/原始需求、LLM 配置

### Requirement: req2task 项目数据
系统应创建 req2task 项目：
- 项目名称: req2task
- 项目Key: REQ2TASK
- 描述: 需求转任务系统 - 软件需求管理系统，支持需求全生命周期管理、多维度信息关联、AI辅助需求生成、变更追溯、项目进度可视化和项目知识库构建
- 状态: PLANNING
- 开始日期: 2024-01-01
- 结束日期: 2024-12-31

### Requirement: 功能模块数据
系统应创建以下功能模块：

| 模块名称 | 模块Key | 描述 |
|---------|---------|------|
| 需求管理 | REQ-MGMT | 需求的全生命周期管理，包括需求的创建、编辑、审核、变更、追踪和归档 |
| 任务管理 | TASK-MGMT | 任务的全生命周期管理，支持任务拆解、分配、执行和验收 |
| AI辅助 | AI-ASSIST | AI辅助需求分析和任务生成功能 |
| 项目管理 | PROJ-MGMT | 项目整体管理和进度可视化 |
| 用户管理 | USER-MGMT | 用户账户和权限管理 |
| 知识库 | KNOWLEDGE | 项目知识库构建和维护 |

### Requirement: 需求数据
系统应为各功能模块创建以下需求：

#### 需求管理模块 (REQ-MGMT)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| 需求CRUD操作 | HIGH | MANUAL |
| 需求状态流转 | HIGH | MANUAL |
| 需求版本管理 | MEDIUM | MANUAL |
| 需求变更记录 | HIGH | MANUAL |
| 需求优先级管理 | MEDIUM | MANUAL |
| 需求导入导出 | LOW | MANUAL |

#### 任务管理模块 (TASK-MGMT)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| 任务CRUD操作 | HIGH | MANUAL |
| 任务分配 | HIGH | MANUAL |
| 任务状态流转 | HIGH | MANUAL |
| 任务进度追踪 | MEDIUM | MANUAL |
| 任务依赖关系 | MEDIUM | MANUAL |

#### AI辅助模块 (AI-ASSIST)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| AI需求分析 | HIGH | MANUAL |
| AI任务拆分 | HIGH | MANUAL |
| AI需求补全 | MEDIUM | MANUAL |
| AI变更影响分析 | MEDIUM | MANUAL |
| 多模型支持 | MEDIUM | MANUAL |

#### 项目管理模块 (PROJ-MGMT)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| 项目CRUD操作 | HIGH | MANUAL |
| 项目成员管理 | HIGH | MANUAL |
| 项目进度仪表盘 | MEDIUM | MANUAL |
| 项目甘特图 | LOW | MANUAL |

#### 用户管理模块 (USER-MGMT)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| 用户认证 | HIGH | MANUAL |
| 用户授权 | HIGH | MANUAL |
| 用户角色管理 | MEDIUM | MANUAL |

#### 知识库模块 (KNOWLEDGE)
| 需求标题 | 优先级 | 来源 |
|---------|--------|------|
| 文档管理 | MEDIUM | MANUAL |
| 文档检索 | MEDIUM | MANUAL |
| 文档关联 | LOW | MANUAL |

### Requirement: 原始需求数据
系统应为关键需求创建原始需求：

| 原始需求内容 | 来源 | 所属模块 |
|-------------|------|---------|
| 我们需要一个需求管理系统，能够管理需求的完整生命周期 | 用户访谈 | 需求管理 |
| 系统应该支持需求的创建、编辑、审核、变更和归档 | 用户访谈 | 需求管理 |
| 需要支持需求的优先级和状态管理 | 用户访谈 | 需求管理 |
| 系统应该能够将需求拆分成可执行的任务 | 用户访谈 | 任务管理 |
| 任务应该支持分配给团队成员，并追踪执行进度 | 用户访谈 | 任务管理 |
| 希望系统能够通过AI辅助生成需求分析 | 产品规划 | AI辅助 |
| AI应该能够理解自然语言需求并生成结构化需求 | 产品规划 | AI辅助 |
| 需要提供项目整体视图，包括进度和资源使用情况 | 项目管理需求 | 项目管理 |
| 系统应该支持多用户协作和权限控制 | 安全需求 | 用户管理 |
| 希望能够沉淀项目知识，支持文档的创建和检索 | 知识管理需求 | 知识库 |

### Requirement: LLM 配置
系统应创建 ollama 提供商的默认 LLM 配置：
- 名称: Ollama Default
- provider: ollama
- model: qwen6:8b
- baseUrl: http://localhost:11434
- maxTokens: 4096
- temperature: 0.7
- topP: 1.0
- isDefault: true
- isActive: true

## MODIFIED Requirements
无

## REMOVED Requirements
无
