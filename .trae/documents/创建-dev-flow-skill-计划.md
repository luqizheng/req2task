# 创建 `/dev-flow` Skill 计划

## 目标

创建名为 `dev-flow` 的 Agent Skill，定义完整的开发流程：
1. **调用 `/spec`** → 执行 spec-driven-development 工作流
2. **pnpm lint + pnpm build** → 质量门禁，修复问题
3. **更新 docs** → 同步文档索引和变更记录

## 背景调研

- 现有 skills 位于 `.agents/skills/` 目录
- `spec-driven-development` skill 已定义完整的四阶段工作流（SPECIFY→PLAN→TASKS→IMPLEMENT）
- 文档管理规范见 `docs/DOCS_MANAGEMENT.md`，文档索引见 `docs/README.md`
- 根目录 `package.json` 中定义了 `pnpm lint` 和 `pnpm build` 命令

## 实施步骤

### Step 1: 创建技能目录和 SKILL.md

- 路径：`.agents/skills/dev-flow/SKILL.md`
- 内容包括：
  - frontmatter：name + description（含触发条件 "Invoke when user runs /dev-flow"）
  - 技能概述
  - 三阶段工作流定义
  - 阶段 1：执行 spec-driven-development
  - 阶段 2：运行 lint + build 并修复
  - 阶段 3：更新文档

### Step 2: 写入 SKILL.md 内容

具体内容包括：

#### 阶段 1: Spec 驱动开发
- 调用 `spec-driven-development` skill
- 遵循其四阶段门控流程
- 所有 spec 产出存放到 `.trae/specs/` 目录

#### 阶段 2: 质量门禁
- 执行 `pnpm lint`，自动修复可修复问题
- 执行 `pnpm build`，确保构建通过
- 使用 `debugging-and-error-recovery` skill 排查并修复问题

#### 阶段 3: 文档更新
- 若 spec 涉及新增功能，更新 `docs/README.md` 索引
- 更新 `docs/plans/` 下的 Sprint 计划状态
- 添加变更日志条目

### Step 3: 验证

- 确认 `.agents/skills/dev-flow/SKILL.md` 结构正确
- 确认与 `using-agent-skills` 的编排兼容
