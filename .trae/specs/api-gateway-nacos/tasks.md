# Tasks

## Phase 1: 项目基础结构

- [x] Task 1.1: 创建 API Gateway 应用
  - [x] 创建 apps/gateway 目录结构
  - [x] 创建 package.json (NestJS + Nacos SDK + 依赖)
  - [x] 创建 tsconfig.json
  - [x] 创建 nest-cli.json
  - [x] 创建 .env.example (Nacos, Redis, 服务配置)

- [x] Task 1.2: 创建核心模块
  - [x] 创建 src/main.ts (应用入口)
  - [x] 创建 src/app.module.ts (根模块)
  - [x] 创建公共工具类 (Logger, 工具函数)
  - [x] 创建类型定义文件

## Phase 2: Nacos 服务注册与发现

- [x] Task 2.1: 实现 Nacos 客户端封装
  - [x] 创建 NacosConfig 配置接口
  - [x] 创建 NacosClientService 服务类
  - [x] 实现服务注册 (registerInstance)
  - [x] 实现心跳机制 (beat heart)
  - [x] 实现服务注销 (deregisterInstance)

- [x] Task 2.2: 实现服务发现
  - [x] 实现服务实例获取 (selectInstances)
  - [x] 实现健康实例过滤
  - [x] 实现多级缓存策略
  - [x] 实现实例变更监听

- [x] Task 2.3: 创建 Nacos 模块
  - [x] 创建 NacosModule 模块
  - [x] 创建 NacosService 服务
  - [x] 实现全局单例模式

## Phase 3: 请求路由转发

- [x] Task 3.1: 实现路由配置管理
  - [x] 创建路由规则接口定义
  - [x] 创建路由匹配器 (支持正则表达式)
  - [x] 实现路由规则优先级管理
  - [x] 实现路由规则冲突检测

- [x] Task 3.2: 实现动态路由配置
  - [x] 从 Nacos 配置中心获取路由规则
  - [x] 实现配置变更监听
  - [x] 实现配置热加载 (3秒内生效)
  - [x] 实现配置版本控制

- [x] Task 3.3: 实现请求转发
  - [x] 创建 ProxyService 服务
  - [x] 实现 HTTP 请求转发
  - [x] 实现请求头透传与转换
  - [x] 实现响应头处理

## Phase 4: 负载均衡

- [x] Task 4.1: 实现负载均衡策略
  - [x] 创建 LoadBalancerStrategy 接口
  - [x] 实现加权轮询策略 (WeightedRoundRobin)
  - [x] 实现加权随机策略 (WeightedRandom)
  - [x] 实现策略动态切换

- [x] Task 4.2: 集成健康检查
  - [x] 基于 Nacos 健康状态动态调整
  - [x] 实现实例权重自动降级
  - [x] 实现不健康实例自动剔除

## Phase 5: 协议支持

- [x] Task 5.1: HTTP/HTTPS 支持
  - [x] 实现 HTTP 请求代理
  - [x] 实现 HTTPS 证书配置
  - [x] 实现 SSL/TLS 卸载

- [x] Task 5.2: SSE 支持
  - [x] 实现 SSE 请求识别
  - [x] 实现流式响应转发
  - [x] 实现连接生命周期管理

- [x] Task 5.3: WebSocket 支持
  - [x] 实现 WebSocket 握手代理
  - [x] 实现数据帧双向转发
  - [x] 实现连接断开处理

## Phase 6: 高可用与集群

- [x] Task 6.1: 高可用架构设计
  - [x] 支持多实例集群部署
  - [x] 实现无状态服务设计
  - [x] 配置健康检查自动剔除

## Phase 7: 可观测性

- [x] Task 7.1: 链路追踪
  - [x] 生成 X-Request-Id 追踪 ID
  - [x] 记录完整调用链路
  - [x] 支持 SkyWalking/Jaeger 集成

- [x] Task 7.2: 监控指标
  - [x] 采集吞吐量指标
  - [x] 采集响应时间指标
  - [x] 采集错误率指标
  - [x] 采集连接数指标
  - [x] 实现 /metrics 端点 (Prometheus 格式)

## Phase 8: 健康检查与熔断

- [x] Task 8.1: 健康检查端点
  - [x] 实现 /health 完整状态端点
  - [x] 实现 /health/live 存活探针
  - [x] 实现 /health/ready 就绪探针

- [x] Task 8.2: 熔断器
  - [x] 实现熔断器状态机 (CLOSED/OPEN/HALF_OPEN)
  - [x] 实现失败计数和阈值触发
  - [x] 实现自动恢复机制

## Phase 9: 配置管理

- [x] Task 9.1: Nacos 配置中心集成
  - [x] 从 Nacos 拉取所有配置
  - [x] 实现配置变更监听
  - [x] 实现配置热加载机制

- [x] Task 9.2: 配置验证
  - [x] 实现配置合法性检查
  - [x] 实现非法配置拒绝
  - [x] 实现配置历史记录

## Phase 10: 文档与测试

- [x] Task 10.1: 编写文档
  - [x] 编写部署指南
  - [x] 编写运维手册
  - [x] 编写故障排查指南

- [x] Task 10.2: 功能测试
  - [x] 编写功能测试用例
  - [x] 执行功能测试
  - [x] 生成测试报告

- [x] Task 10.3: 性能测试
  - [x] 执行吞吐量测试
  - [x] 执行响应时间测试
  - [x] 执行并发能力测试
  - [x] 生成性能测试报告

## Task Dependencies
- Phase 2 依赖 Phase 1
- Phase 3 依赖 Phase 2
- Phase 4 依赖 Phase 2
- Phase 5 依赖 Phase 3
- Phase 6 依赖 Phase 2
- Phase 7 依赖 Phase 3
- Phase 8 依赖 Phase 1
- Phase 9 依赖 Phase 2
- Phase 10 依赖 Phase 3-9
