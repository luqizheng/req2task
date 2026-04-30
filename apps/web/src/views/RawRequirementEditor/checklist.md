# Checklist: AI 生成 Title 功能

## 规范验证
- [x] spec.md 已创建并包含所有 6 个核心部分
- [x] tasks.md 已创建，任务已按依赖顺序排列
- [x] 成功标准具体且可测试

## 实现验证
- [ ] DTO 已添加到 packages/dto
- [ ] 后端 API 已实现 (/ai/generate-title)
- [ ] 前端 UI 已更新 (title 输入框 + magic 按钮)
- [ ] 前端逻辑已实现 (generateTitle 方法)
- [ ] 表单验证已配置

## 质量验证
- [ ] pnpm lint 通过
- [ ] pnpm type-check 通过
- [ ] 手动功能测试通过

## 交付物
- [ ] DTO 变更
- [ ] 后端 API 变更
- [ ] 前端 UI 变更
- [ ] 前端逻辑变更
