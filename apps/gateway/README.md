# Gateway API 网关

## 概述

Gateway 是 req2task 项目的统一 API 网关，提供服务代理、负载均衡、熔断器、健康检查、链路追踪和指标监控等功能。

## 核心功能

| 功能 | 说明 |
|------|------|
| **智能路由** | 基于路径匹配将请求转发到后端服务 |
| **负载均衡** | 支持加权随机、加权轮询策略 |
| **熔断器** | 失败率过高时自动熔断，保护后端服务 |
| **限流** | 基于 IP/用户的多维度限流 |
| **健康检查** | Liveness/Readiness 检查 |
| **链路追踪** | 请求全链路追踪 |
| **指标监控** | Prometheus 格式指标导出 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 9.0.0
- Nacos 配置中心（开发环境可选）

### 本地开发

```bash
cd apps/gateway
pnpm install
pnpm start:dev
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改：

```bash
cp .env.example .env
```

关键配置项：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 8080 | 网关监听端口 |
| `NACOS_HOST` | localhost | Nacos 服务器地址 |
| `NACOS_PORT` | 8848 | Nacos 端口 |
| `CORS_ORIGIN` | http://localhost:5173 | 允许的跨域源 |

## API 接口

### 健康检查

```
GET /api/health          # 综合健康状态
GET /api/health/live     # 存活检查
GET /api/health/ready    # 就绪检查
```

### 指标监控

```
GET /api/metrics         # Prometheus 格式指标
```

### 代理接口

所有未匹配的请求都会被代理到后端服务。

## 模块结构

```
src/
├── circuit-breaker/    # 熔断器实现
├── common/            # 公共工具（Logger）
├── health/            # 健康检查模块
├── loadbalancer/       # 负载均衡策略
├── metrics/           # Prometheus 指标
├── nacos/             # Nacos 服务发现
├── proxy/             # 请求代理
├── router/            # 路由匹配
└── tracing/            # 链路追踪
```

## 部署

### Docker 部署

```bash
docker build -t req2task-gateway .
docker run -p 8080:8080 --env-file .env req2task-gateway
```

### 生产环境

```bash
pnpm build
pnpm start:prod
```

## 测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e
```

## 架构设计

```
客户端请求
    │
    ▼
┌─────────┐
│ 限流层  │ ← 速率限制
└────┬────┘
    │
    ▼
┌─────────┐
│ 路由层  │ ← 路径匹配 + 服务发现
└────┬────┘
    │
    ▼
┌─────────┐
│ 负载均衡 │ ← 加权随机/轮询
└────┬────┘
    │
    ▼
┌─────────┐
│ 熔断器  │ ← 故障保护
└────┬────┘
    │
    ▼
┌─────────┐
│ 代理层  │ ← 转发到后端
└────┬────┘
    │
    ▼
 后端服务
```
