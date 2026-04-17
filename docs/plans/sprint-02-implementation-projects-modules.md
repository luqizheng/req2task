# Sprint 02: 项目与模块管理

**计划类型**: 后端实施路线图
**目标**: 完成项目 CRUD、功能模块 CRUD、项目成员管理
**预计时长**: 1 周
**状态**: ⏳ 待开始
**里程碑**: M1

---

## 1. 目标

- 完成项目 CRUD
- 完成功能模块 CRUD
- 项目成员管理

---

## 2. 任务列表

| 任务 | 类型 | 预估 | 优先级 | 状态 |
|------|------|------|--------|------|
| Project Entity 开发 | dev | 4h | P0 | ⏳ |
| ProjectService 开发 | dev | 6h | P0 | ⏳ |
| ProjectController 开发 | dev | 4h | P0 | ⏳ |
| ProjectModule 创建 | dev | 2h | P0 | ⏳ |
| FeatureModule Entity 开发 | dev | 4h | P0 | ⏳ |
| FeatureModuleService 开发 | dev | 6h | P0 | ⏳ |
| FeatureModuleController 开发 | dev | 4h | P0 | ⏳ |
| 项目成员管理 | dev | 6h | P1 | ⏳ |
| 数据库迁移脚本 | dev | 4h | P0 | ⏳ |

**总预估工时**: 40h

---

## 3. 交付物

- Project 模块完整 API
- FeatureModule 模块完整 API
- 数据库迁移脚本

---

## 4. 验收标准

- [ ] 可创建/编辑/删除项目
- [ ] 可创建/编辑/删除功能模块
- [ ] 可添加/移除项目成员
- [ ] 模块支持层级嵌套

---

## 5. API 设计

### 5.1 Project API

```typescript
// 后端接口
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

### 5.2 FeatureModule API

```typescript
// 后端接口
GET    /projects/:projectId/feature-modules      // 列表
GET    /feature-modules/:id                      // 详情
POST   /projects/:projectId/feature-modules      // 创建
PUT    /feature-modules/:id                      // 更新
DELETE /feature-modules/:id                      // 删除
```

---

## 6. 依赖关系

- **前置条件**: Sprint 1 基础设施准备完成
- **后续 Sprint**: Sprint 3 需要使用项目模块

---

## 7. 完成标准

- [ ] 所有 API 接口正常工作
- [ ] 数据库迁移脚本可执行
- [ ] 单元测试覆盖率 ≥ 70%

---

**上一 Sprint**: [Sprint 01: 基础设施准备](sprint-01-implementation-infrastructure.md)
**下一 Sprint**: [Sprint 03: 需求管理基础](sprint-03-implementation-requirements-basics.md)
