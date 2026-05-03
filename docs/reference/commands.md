# 全局命令

所有命令均在根目录执行。

## 开发命令

```bash
pnpm dev:web                  # 启动前端开发服务器
pnpm dev:service              # 启动后端开发服务器（自动检查4000端口占用情况）
pnpm dev:ai-chat-service      # 启动 AI 聊天服务
```

## 基础设施命令

```bash
pnpm dev:infra                # 启动开发基础设施服务（PostgreSQL, Redis, ChromaDB, Nacos等）
pnpm dev:infra:stop           # 停止开发基础设施服务
pnpm check:env                # 检查开发环境工具（Node.js, pnpm, Docker等）
```

## 构建命令

```bash
pnpm build                    # 构建所有应用
pnpm build:web                # 构建前端
pnpm build:service            # 构建后端
```

## 代码质量命令

```bash
pnpm lint                     # 检查所有代码
pnpm lint:fix                 # 修复所有包的 lint 问题
pnpm lint:check               # 检查所有包的 lint 问题（详细报告）
pnpm lint:remove-unused       # 检测未使用的导入（默认扫描后端）
pnpm lint:remove-unused:fix   # 自动移除未使用的导入
```

## 测试命令

```bash
pnpm test                     # 运行所有测试
pnpm test:web                 # 运行前端测试
pnpm test:e2e:web             # 运行前端 E2E 测试
pnpm test:e2e                 # 运行后端 E2E 测试
pnpm test:all                 # 运行所有测试（包括 E2E）
```

## 数据库命令

```bash
# 主服务数据库
pnpm db:migration:generate     # 生成数据库迁移
pnpm db:migration:run          # 运行数据库迁移
pnpm db:migration:revert       # 回滚数据库迁移
pnpm db:migration:show         # 查看迁移状态
pnpm db:reset                  # 重置数据库
pnpm db:seed                   # 填充数据库

# AI 聊天服务数据库
pnpm db:ai-chat:migration:generate  # 生成 AI 聊天服务数据库迁移
pnpm db:ai-chat:migration:run       # 运行 AI 聊天服务数据库迁移
pnpm db:ai-chat:migration:revert    # 回滚 AI 聊天服务数据库迁移
pnpm db:ai-chat:migration:show      # 查看 AI 聊天服务迁移状态
```

## Monorepo 工作流

- 使用 `pnpm --filter <package>` 针对特定包执行命令
- 工作区配置位于 `pnpm-workspace.yaml`
- 应用位于 `apps/` 目录下
