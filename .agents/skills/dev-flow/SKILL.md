---
name: dev-flow
description: 全流程开发流水线。当收到 /dev-flow 命令时调用，依次执行：spec 驱动开发 → lint/build 质量门禁 → 文档同步更新。
---

# Dev Flow

## 概述

`/dev-flow` 是一条完整的开发流水线，将 spec-driven-development、质量门禁和文档更新串联为一个可重复执行的流程。

```
/dev-flow
    │
    ├── Phase 1: Spec 驱动开发
    │   └── 调用 spec-driven-development skill
    │
    ├── Phase 2: 质量门禁
    │   ├── pnpm lint（自动修复可修复问题）
    │   └── pnpm build（确保构建通过）
    │
    └── Phase 3: 文档更新
        ├── 更新 docs/README.md 索引
        └── 更新变更记录
```

## 触发条件

- 用户输入 `/dev-flow` 命令时立即调用
- 当前执行的工作流包含完整的 规范→编码→验证→归档 周期

## Phase 1: Spec 驱动开发

当用户提供一个需求描述时：

1. 调用 `spec-driven-development` skill，遵循其四阶段门控流程
2. 所有 spec 产出物存放在 `.trae/specs/<spec-name>/` 目录
3. 每阶段完成后等待用户确认，不可自动推进
4. 实施阶段完成后，标记 Phase 1 完成

## Phase 2: 质量门禁

在 spec 实施完成后执行以下检查：

### 步骤 1: 运行 pnpm lint

```bash
pnpm lint
```

- 若 lint 通过 → 继续
- 若 lint 报错 → 先运行 `pnpm lint --fix` 尝试自动修复
- 若仍有未修复的错误 → 调用 `debugging-and-error-recovery` skill 逐项排查修复
- 循环直到 lint 完全通过

### 步骤 2: 运行 pnpm build

```bash
pnpm build
```

- 若构建通过 → 继续
- 若构建失败 → 调用 `debugging-and-error-recovery` skill 排查修复
- 循环直到构建完全通过

## Phase 3: 文档更新

### 步骤 1: 更新 docs/README.md

若 spec 涉及新增功能、模块或 API：

- 检查 `docs/README.md` 文档索引
- 添加新增文档的索引条目
- 更新 `last_updated` 日期
- 若文档状态有变更（如规划中→已实现），同步更新

### 步骤 2: 更新变更日志

在受影响的文档底部添加变更日志条目：

```markdown
## 变更日志

| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| v1.x.0 | YYYY-MM-DD | Agent | [变更说明] |
```

### 步骤 3: 检查 Sprint 计划

- 检查 `docs/plans/` 下是否有相关 sprint 计划需要更新状态
- 使用状态符号：✅ 完成 | 🚧 进行中 | ⏳ 待开始

## 验证

确认以下检查点全部通过：

- [ ] Phase 1: spec-driven-development 四阶段均已完成
- [ ] Phase 2: `pnpm lint` 通过
- [ ] Phase 2: `pnpm build` 通过
- [ ] Phase 3: `docs/README.md` 索引已同步
- [ ] Phase 3: 变更日志已更新
