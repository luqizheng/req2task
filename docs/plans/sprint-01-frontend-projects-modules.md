# Sprint 01: 项目与模块管理

**计划类型**: 前端开发计划
**目标**: 实现项目列表、详情、成员管理功能模块
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M1

---

## 1. 目标

实现项目列表、详情、成员管理功能模块。

---

## 2. 任务列表

| 任务 | 预估 | 优先级 | 状态 |
|------|------|--------|------|
| API: projects.ts | 4h | P0 | ⏳ |
| API: feature-modules.ts | 4h | P0 | ⏳ |
| Store: project.ts | 6h | P0 | ⏳ |
| ProjectListView.vue | 8h | P0 | ⏳ |
| ProjectDetailView.vue | 8h | P0 | ⏳ |
| 项目组件封装 | 4h | P1 | ⏳ |

**总预估工时**: 34h

---

## 3. 交付物

- ProjectListView.vue - 项目列表页面
- ProjectDetailView.vue - 项目详情页面
- 项目相关组件封装

---

## 4. 验收标准

- [ ] 可查看项目列表
- [ ] 可创建/编辑/删除项目
- [ ] 可查看项目详情
- [ ] 可管理项目成员

---

## 5. 页面结构

### 5.1 ProjectListView.vue

```
项目列表
├── 搜索/筛选栏
├── 项目卡片列表
│   └── ProjectCard
│       ├── 项目名称
│       ├── 项目描述
│       ├── 成员头像
│       └── 操作按钮
├── 创建项目按钮
└── 分页组件
```

### 5.2 ProjectDetailView.vue

```
项目详情
├── 项目信息区
│   ├── 项目名称
│   ├── 项目 Key
│   ├── 描述
│   └── 操作按钮
├── 成员管理区
│   └── MemberList
│       ├── 成员列表
│       └── 添加成员
├── 功能模块树
│   └── FeatureModuleTree
│       ├── 模块层级
│       └── 拖拽排序
└── 关联统计
    ├── 需求数
    └── 任务数
```

---

## 6. 组件清单

| 组件 | 说明 |
|------|------|
| ProjectCard | 项目卡片组件 |
| ProjectForm | 项目表单组件 |
| MemberList | 成员列表组件 |
| MemberSelect | 成员选择器组件 |

---

## 7. 路由配置

```typescript
{
  path: '/projects',
  name: 'ProjectListView',
  component: ProjectListView
},
{
  path: '/projects/:id',
  name: 'ProjectDetailView',
  component: ProjectDetailView
}
```

---

## 8. API 设计

### 8.1 projects.ts

```typescript
// API 调用层
GET    /projects                    // 列表 (分页)
GET    /projects/:id                // 详情
GET    /projects/key/:projectKey    // 按 Key 查找
POST   /projects                    // 创建
PUT    /projects/:id                // 更新
DELETE /projects/:id                // 删除
GET    /projects/:id/members        // 成员列表
POST   /projects/:id/members        // 添加成员
DELETE /projects/:id/members/:userId // 移除成员
```

### 8.2 feature-modules.ts

```typescript
// API 调用层
GET    /projects/:projectId/feature-modules      // 列表
GET    /feature-modules/:id                      // 详情
POST   /projects/:projectId/feature-modules      // 创建
PUT    /feature-modules/:id                      // 更新
DELETE /feature-modules/:id                      // 删除
```

---

## 9. 依赖关系

- **前置条件**: 后端 Sprint 2 完成
- **后续 Sprint**: Sprint 2 需要项目模块 API

---

## 10. 技术规范

- `.vue` 单文件不超过 500 行
- 超过需拆分组件
- 使用 Pinia Store 管理状态
- API 错误统一处理

---

**上一 Sprint**: 无
**下一 Sprint**: [Sprint 02: 需求管理基础](sprint-02-frontend-requirements-basics.md)
