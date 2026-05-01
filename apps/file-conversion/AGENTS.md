# @req2task/file-conversion

## 开发指南

### 启动开发服务器

```bash
pnpm dev:file-conversion
```

### 构建

```bash
pnpm -F @req2task/file-conversion build
```

## 服务概述

Express 独立服务，负责文件格式转换（PDF、DOCX、音频等）。使用 Nacos 进行服务注册与发现。

## 转换类型

- **PDF 转换**：提取 PDF 文档文本内容
- **DOCX 转换**：提取 Word 文档文本内容
- **音频转换**：通过 OpenAI Whisper API 将音频转为文本

## 端口

默认 4002（通过 `PORT` 环境变量可覆盖）

## 关键文件

- `src/main.ts` - 服务入口
- `src/app.ts` - Express 应用配置，含 Nacos 服务注册
- `src/routes/convert.routes.ts` - 转换路由
- `src/services/conversion.service.ts` - 核心转换逻辑
- `src/services/pdf.service.ts` - PDF 转换
- `src/services/docx.service.ts` - DOCX 转换
- `src/services/audio.service.ts` - 音频转换

## 开发规范

1. 使用结构化日志，禁止 console.log
2. 新转换类型需在 `src/services/` 下添加对应服务
3. 运行 lint 后再提交
