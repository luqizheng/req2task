# API Gateway 故障排查指南

## 快速诊断

### 1. 检查服务状态
```bash
# 检查 Gateway 健康状态
curl http://localhost:3000/api/health

# 检查 Nacos 连接状态
curl http://localhost:3000/api/health/ready
```

### 2. 检查日志
```bash
# 查看最近错误日志
docker logs gateway --tail 100 --since 5m | grep ERROR

# 搜索特定请求的日志
docker logs gateway | grep "request-id"
```

## 常见问题

### 问题 1: 请求返回 502 Bad Gateway

**症状**: 客户端收到 502 错误

**可能原因**:
1. 后端服务未启动
2. 后端服务端口配置错误
3. 网络连接问题
4. 熔断器已打开

**排查步骤**:
```bash
# 1. 检查后端服务是否运行
curl http://localhost:4000/api/health

# 2. 检查路由配置
curl http://localhost:3000/api/routes

# 3. 检查熔断器状态
curl http://localhost:3000/api/circuit-breaker/status

# 4. 查看详细日志
docker logs gateway | grep "502"
```

**解决方案**:
- 启动后端服务
- 修复路由配置
- 重置熔断器

### 问题 2: 熔断器频繁打开

**症状**: 某些服务的请求总是失败，熔断器不断打开关闭

**可能原因**:
1. 后端服务性能问题
2. 数据库或缓存连接问题
3. 依赖服务超时配置不当

**排查步骤**:
```bash
# 1. 查看熔断器状态
curl http://localhost:3000/api/circuit-breaker/status

# 2. 检查后端服务日志
curl http://localhost:4000/api/health

# 3. 检查网络延迟
ping backend-service
```

**解决方案**:
- 调整熔断器阈值配置
- 优化后端服务性能
- 增加超时时间配置

### 问题 3: Nacos 连接失败

**症状**: Gateway 日志显示无法连接 Nacos

**可能原因**:
1. Nacos 服务未启动
2. 网络不通
3. 端口配置错误
4. 认证信息错误

**排查步骤**:
```bash
# 1. 检查 Nacos 是否运行
curl http://localhost:8848/nacos/v1/console/health/readiness

# 2. 检查网络连通性
telnet localhost 8848

# 3. 查看 Gateway 日志
docker logs gateway | grep Nacos
```

**解决方案**:
- 启动 Nacos 服务
- 修复网络配置
- 验证端口和认证信息

### 问题 4: 路由规则不生效

**症状**: 请求未按预期转发到目标服务

**可能原因**:
1. 路由规则配置错误
2. 路由优先级问题
3. 配置未正确加载

**排查步骤**:
```bash
# 1. 查看当前路由配置
curl http://localhost:3000/api/routes

# 2. 测试路由匹配
curl -v http://localhost:3000/api/test/path

# 3. 检查 Nacos 配置中心
curl http://localhost:8848/nacos/v1/cs/configs?dataId=gateway-routes&group=DEFAULT_GROUP
```

**解决方案**:
- 修复路由规则配置
- 调整路由优先级
- 手动刷新配置

### 问题 5: 高延迟问题

**症状**: 请求响应时间过长

**可能原因**:
1. 负载不均衡
2. 后端服务性能问题
3. 网络延迟
4. 超时配置过短

**排查步骤**:
```bash
# 1. 查看响应时间指标
curl http://localhost:3000/metrics | grep response_time

# 2. 检查负载均衡状态
curl http://localhost:3000/api/loadbalancer/stats

# 3. 测试网络延迟
curl -w "@curl-format.txt" -o /dev/null -s http://backend:4000/api/health
```

**解决方案**:
- 调整负载均衡策略
- 优化后端服务
- 增加超时时间

### 问题 6: WebSocket 连接失败

**症状**: WebSocket 连接被拒绝

**可能原因**:
1. WebSocket 代理未正确配置
2. 后端服务不支持 WebSocket
3. 代理超时配置

**排查步骤**:
```bash
# 1. 检查 WebSocket 支持
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3000/api/ws/path

# 2. 查看 WebSocket 日志
docker logs gateway | grep WebSocket
```

**解决方案**:
- 启用 WebSocket 代理
- 配置 WebSocket 超时时间
- 检查后端 WebSocket 支持

## 调试工具

### 请求追踪
```bash
# 发送带追踪 ID 的请求
curl -H "X-Trace-Id: test-123" http://localhost:3000/api/auth/login

# 查看追踪记录
curl http://localhost:3000/api/traces/test-123
```

### 指标分析
```bash
# 导出 Prometheus 指标
curl http://localhost:3000/metrics > metrics.txt

# 使用 promtool 验证
promtool check metrics < metrics.txt
```

## 性能分析

### CPU 问题
```bash
# 查看 CPU 使用情况
docker stats gateway --no-stream

# Node.js CPU profile
docker exec gateway node --prof app.js
```

### 内存问题
```bash
# 查看内存使用
docker stats gateway --no-stream

# 生成堆快照
docker exec gateway curl -o /tmp/heapdump.heap http://localhost:3000/debug/heapdump
```

### 连接问题
```bash
# 查看活动连接
netstat -an | grep :3000 | wc -l

# 查看 TIME_WAIT 连接
netstat -an | grep TIME_WAIT | wc -l
```

## 恢复步骤

### 紧急恢复
```bash
# 1. 停止 Gateway
docker-compose stop gateway

# 2. 回滚到上一版本
docker-compose pull gateway:previous
docker-compose up -d gateway

# 3. 验证恢复
curl http://localhost:3000/api/health
```

### 配置回滚
```bash
# 1. 恢复备份配置
docker cp config-backup/:3000/config gateway:/app/

# 2. 重启 Gateway
docker-compose restart gateway

# 3. 验证配置
curl http://localhost:3000/api/routes
```
