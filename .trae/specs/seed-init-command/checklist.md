# Checklist - 初始化数据命令

## Command Structure
- [x] Seed 命令文件结构正确创建（seed.module.ts, seed.service.ts）
- [x] SeedService 正确注入 DataSource
- [x] SeedModule 正确导入到 AppModule

## Project Data
- [x] req2task 项目创建（名称、Key、描述、状态、日期）
- [x] 项目 Key 为 REQ2TASK 且唯一
- [x] 项目状态为 PLANNING

## Feature Module Data
- [x] 需求管理模块创建（REQ-MGMT）
- [x] 任务管理模块创建（TASK-MGMT）
- [x] AI辅助模块创建（AI-ASSIST）
- [x] 项目管理模块创建（PROJ-MGMT）
- [x] 用户管理模块创建（USER-MGMT）
- [x] 知识库模块创建（KNOWLEDGE）
- [x] 模块按 sort 字段正确排序

## Requirement Data
- [x] REQ-MGMT 模块包含 6 个需求（CRUD、状态流转、版本管理、变更记录、优先级管理、导入导出）
- [x] TASK-MGMT 模块包含 5 个需求（CRUD、任务分配、状态流转、进度追踪、依赖关系）
- [x] AI-ASSIST 模块包含 5 个需求（需求分析、任务拆分、需求补全、变更影响分析、多模型支持）
- [x] PROJ-MGMT 模块包含 4 个需求（项目CRUD、成员管理、仪表盘、甘特图）
- [x] USER-MGMT 模块包含 3 个需求（认证、授权、角色管理）
- [x] KNOWLEDGE 模块包含 3 个需求（文档管理、检索、关联）
- [x] 所有需求的 source 为 MANUAL
- [x] 需求的 priority 字段正确设置

## Raw Requirement Data
- [x] 创建 10 条原始需求
- [x] 原始需求包含正确的 source 和 moduleId
- [x] 原始需求的 status 为 PENDING

## LLM Config Data
- [x] ollama LLM 配置正确创建
- [x] provider 为 ollama
- [x] modelName 为 qwen6:8b
- [x] baseUrl 为 http://localhost:11434
- [x] isDefault 为 true
- [x] isActive 为 true
- [x] maxTokens 为 4096
- [x] temperature 为 0.7

## Package Script
- [x] apps/service/package.json 包含 seed 脚本
- [x] seed 命令可正常执行（pnpm seed）

## Validation
- [x] seed 命令执行成功无报错
- [x] 数据库中可查询到 req2task 项目
- [x] 数据库中可查询到 6 个功能模块
- [x] 数据库中可查询到所有需求数据
- [x] 数据库中可查询到原始需求数据
- [x] 数据库中可查询到 LLM 配置
