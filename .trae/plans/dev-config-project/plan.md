# dev-config 项目计划

## 目标
创建 dev-config 包，集中管理开发环境配置，实现：
- 统一的 tsup 构建配置
- 避免重复配置和设置冲突
- dto/service/web 共享配置

## 任务清单

### 1. 创建 dev-config 包结构
- [ ] 创建 `packages/dev-config/` 目录
- [ ] 创建 `package.json`，包含 tsup 依赖
- [ ] 创建基础 `tsconfig.json`

### 2. 实现 tsup 配置
- [ ] 创建 `tsup.config.ts`，定义构建选项
- [ ] 支持 ESM 和 CJS 双格式
- [ ] 配置类型导出

### 3. 迁移 dto 包到 dev-config
- [ ] 更新 dto 的 tsup.config.ts 使用 dev-config
- [ ] 保留 dto 特定配置覆盖

### 4. 验证和测试
- [ ] 测试 dto 包构建
- [ ] 更新 AGENTS.md 文档

## 注意事项
- service 和 web 保持原有构建方式（nest build / vite build）
- dev-config 主要服务需要 tsup 的包
- 遵循现有代码风格
