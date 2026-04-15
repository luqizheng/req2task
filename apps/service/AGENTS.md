# @req2task/service

## 开发指南

### 启动开发服务器

```bash
pnpm dev:service
# 或直接
cd apps/service
pnpm start:dev
```

### 构建

```bash
pnpm build:service
# 或
cd apps/service && pnpm build
```

## 测试

```bash
pnpm test               # 运行单元测试
pnpm test:watch         # 监听模式运行测试
pnpm test:cov           # 生成覆盖率报告
pnpm test:e2e           # 运行端到端测试
```

## 代码检查

```bash
pnpm lint
# 或
cd apps/service && pnpm lint
```

## 架构

- **框架**: NestJS
- **ORM**: TypeORM
- **数据库**: PostgreSQL（配置于 .env.example）
- **验证**: class-validator + class-transformer

## 关键文件

- `src/main.ts` - 应用入口
- `src/app.module.ts` - 根模块
- `src/app.controller.ts` - 根控制器
- `src/app.service.ts` - 根服务

## 开发规范

1. 使用依赖注入（Constructor Injection）
2. 使用 DTO 进行请求/响应验证
3. 使用模块组织功能
4. 运行 lint 和 test 后再提交
