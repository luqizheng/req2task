# Checklist

## 布局实现

- [ ] RequirementCollectView.vue 使用 Sidebar 组件
- [ ] 响应式布局支持 md/lg/xl 断点
- [ ] 各面板有合适的间距和 padding

## 表单组件

- [ ] CollectionForm 使用 Form + Input + Select 组件
- [ ] 表单验证使用 Zod schema
- [ ] 提交按钮显示 Loading 状态

## 数据展示

- [ ] RequirementList 使用 Table 组件
- [ ] 支持分页（Pagination 组件）
- [ ] 支持排序功能
- [ ] 状态使用 Badge 组件展示

## 交互反馈

- [ ] Sonner 组件集成完成
- [ ] 操作成功显示 Toast
- [ ] 操作失败显示错误提示
- [ ] 危险操作使用 AlertDialog 确认

## 冲突展示

- [ ] 冲突使用 Alert (destructive) 组件
- [ ] 冲突类型使用 Badge 展示
- [ ] 关联需求使用 Card 组件

## 代码规范

- [ ] 主视图文件不超过 500 行
- [ ] 组件文件不超过 300 行
- [ ] 使用 `cn()` 合并类名
- [ ] 样式统一使用 Tailwind CSS
- [ ] `pnpm build` 无错误
- [ ] 无 TypeScript 类型错误
