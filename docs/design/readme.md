# 设计文档

## 目录结构

```
design/
├── _meta/              # 元数据和版本控制
├── ai/                 # AI 相关设计
├── data/               # 数据设计
├── modules/            # 模块设计
└── project/            # 项目设计
```

## 分类索引

| 分类 | 说明 | 文档数 |
|------|------|--------|
| [ai/](ai/readme.md) | AI 辅助需求分析、LLM 服务管理 | 2 |
| [data/](data/readme.md) | 数据库设计、ER 图 | 1 |
| [modules/](modules/readme.md) | 模块边界、依赖关系 | 1 |
| [project/](project/readme.md) | 项目用户系统设计 | 1 |

## 版本控制

版本信息存储在 [_meta/versions.json](_meta/versions.json)

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-04-17 | 重构目录结构，添加版本控制 |
