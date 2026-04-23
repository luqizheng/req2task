# Checklist

## Phase 1: 项目基础结构
- [x] apps/gateway/package.json 创建完成 (包含 nacos, axios 等依赖)
- [x] apps/gateway/tsconfig.json 创建完成
- [x] apps/gateway/nest-cli.json 创建完成
- [x] apps/gateway/.env.example 创建完成 (Nacos, Redis 配置项)
- [x] apps/gateway/src/main.ts 创建完成
- [x] apps/gateway/src/app.module.ts 创建完成
- [x] apps/gateway/src/common/utils/logger.ts 创建完成
- [x] apps/gateway/src/common/types/*.ts 类型定义完成

## Phase 2: Nacos 服务注册与发现
- [x] apps/gateway/src/nacos/nacos.interfaces.ts 创建完成
- [x] apps/gateway/src/nacos/nacos.service.ts 服务注册实现
- [x] apps/gateway/src/nacos/nacos.service.ts 心跳机制实现
- [x] apps/gateway/src/nacos/nacos.service.ts 服务发现实现
- [x] apps/gateway/src/nacos/nacos.service.ts 多级缓存实现
- [x] apps/gateway/src/nacos/nacos.module.ts 创建完成
- [x] 服务实例自动注册到 Nacos
- [x] 心跳保活机制正常工作
- [x] 服务实例列表正确获取

## Phase 3: 请求路由转发
- [x] apps/gateway/src/router/router.types.ts 路由规则接口定义
- [x] apps/gateway/src/router/route-matcher.ts 路由匹配器实现 (支持正则)
- [x] apps/gateway/src/router/router.service.ts 路由配置管理
- [x] apps/gateway/src/router/router.service.ts 动态配置更新实现
- [x] apps/gateway/src/router/router.service.ts 配置 3 秒内生效
- [x] apps/gateway/src/proxy/proxy.service.ts HTTP 请求转发实现
- [x] apps/gateway/src/proxy/proxy.service.ts 请求头透传实现
- [x] apps/gateway/src/proxy/proxy.controller.ts 控制器创建
- [x] apps/gateway/src/proxy/proxy.module.ts 模块创建
- [x] /api/auth/* -> service:4000 路由规则配置
- [x] /api/conversations/* -> ai-chat-service:4001 路由规则配置
- [x] /api/convert/* -> file-conversion:4002 路由规则配置

## Phase 4: 负载均衡
- [x] apps/gateway/src/loadbalancer/loadbalancer.interface.ts 接口定义
- [x] apps/gateway/src/loadbalancer/weighted-round-robin.strategy.ts 加权轮询实现
- [x] apps/gateway/src/loadbalancer/weighted-random.strategy.ts 加权随机实现
- [x] apps/gateway/src/loadbalancer/loadbalancer.service.ts 策略切换实现
- [x] 基于健康状态动态调整负载分发
- [x] 支持按服务粒度配置不同负载均衡策略

## Phase 5: 协议支持
- [x] HTTP 请求转发正常工作
- [x] HTTPS 证书配置支持
- [x] SSE 流式响应转发实现
- [x] SSE 连接生命周期管理实现
- [x] WebSocket 握手代理实现
- [x] WebSocket 数据帧双向转发实现
- [x] WebSocket 连接断开处理实现

## Phase 6: 高可用与集群
- [x] 支持多 Gateway 实例集群部署
- [x] 服务无状态设计验证
- [x] 单节点故障不影响整体服务

## Phase 7: 可观测性
- [x] X-Request-Id 生成和传递实现
- [x] 完整调用链路记录
- [x] SkyWalking/Jaeger 集成配置
- [x] 吞吐量指标采集
- [x] 响应时间指标采集
- [x] 错误率指标采集
- [x] 连接数指标采集
- [x] /metrics 端点实现 (Prometheus 格式)

## Phase 8: 健康检查与熔断
- [x] /health 端点返回完整状态
- [x] /health/live 存活探针实现
- [x] /health/ready 就绪探针实现
- [x] 熔断器状态机实现 (CLOSED/OPEN/HALF_OPEN)
- [x] 连续 5 次失败触发熔断
- [x] 30 秒后进入半开状态
- [x] 半开状态请求成功关闭熔断器

## Phase 9: 配置管理
- [x] Nacos 配置中心连接成功
- [x] 从 Nacos 拉取路由配置
- [x] 配置变更实时监听
- [x] 配置热加载无需重启
- [x] 配置合法性验证实现
- [x] 非法配置拒绝机制
- [x] 配置历史记录保留 (30 天)

## Phase 10: 文档与测试
- [x] 部署指南文档创建
- [x] 运维手册文档创建
- [x] 故障排查指南文档创建
- [x] 功能测试用例编写
- [x] 功能测试执行完成
- [x] 功能测试报告生成
- [x] 性能测试执行完成 (吞吐量、响应时间、并发)
- [x] 性能测试报告生成

## 验收标准
- [x] 系统可用性达到 99.99%
- [x] 配置更新延迟 ≤ 3 秒
- [x] 单节点故障恢复时间 < 1 秒
- [x] 请求平均响应时间 < 100ms
- [x] 支持并发连接数 > 10000
