# Tasks - 初始化数据命令

- [x] Task 1: 创建 seed 命令基础结构
  - [x] 创建 apps/service/src/commands/seed 目录
  - [x] 创建 seed.module.ts 模块文件
  - [x] 创建 seed.service.ts 服务文件
  - [x] 在 app.module.ts 中导入 seed.module

- [x] Task 2: 实现项目数据初始化
  - [x] 创建 req2task 项目（名称、Key、描述、日期）
  - [x] 创建功能模块：需求管理(REQ-MGMT)、任务管理(TASK-MGMT)、AI辅助(AI-ASSIST)、项目管理(PROJ-MGMT)、用户管理(USER-MGMT)、知识库(KNOWLEDGE)
  - [x] 设置模块排序和层级关系

- [x] Task 3: 实现需求数据初始化
  - [x] 为 REQ-MGMT 模块创建 6 个需求（需求CRUD、状态流转、版本管理、变更记录、优先级管理、导入导出）
  - [x] 为 TASK-MGMT 模块创建 5 个需求（任务CRUD、任务分配、状态流转、进度追踪、依赖关系）
  - [x] 为 AI-ASSIST 模块创建 5 个需求（需求分析、任务拆分、需求补全、变更影响分析、多模型支持）
  - [x] 为 PROJ-MGMT 模块创建 4 个需求（项目CRUD、成员管理、仪表盘、甘特图）
  - [x] 为 USER-MGMT 模块创建 3 个需求（认证、授权、角色管理）
  - [x] 为 KNOWLEDGE 模块创建 3 个需求（文档管理、检索、关联）

- [x] Task 4: 实现原始需求数据初始化
  - [x] 创建 10 条原始需求（对应各模块关键需求）

- [x] Task 5: 实现 LLM 配置初始化
  - [x] 创建 ollama 配置（名称: Ollama Default, 模型: qwen6:8b）
  - [x] 设置 baseUrl: http://localhost:11434
  - [x] 设置 isDefault: true, isActive: true

- [x] Task 6: 添加 package.json seed 脚本
  - [x] 在 apps/service/package.json 添加 seed 脚本

- [x] Task 7: 验证 seed 命令
  - [x] 确保数据库连接正常
  - [x] 运行 seed 命令验证数据插入
  - [x] 验证数据库中的数据正确性（项目、模块、需求、原始需求、LLM配置）

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 1
- Task 6 依赖 Task 1-5
- Task 7 依赖 Task 6
