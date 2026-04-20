# API Gateway 运维手册

## 监控指标

### Prometheus 指标端点
```bash
curl http://localhost:3000/metrics
```

### 关键指标

| 指标名 | 类型 | 说明 |
|--------|------|------|
| gateway_uptime | gauge | 网关运行时间（秒） |
| requests_total | counter | 总请求数 |
| requests_success | counter | 成功请求数 |
| requests_failed | counter | 失败请求数 |
| response_time | histogram | 响应时间分布 |
| active_connections | gauge | 活跃连接数 |

## 运维命令

### 路由管理
```bash
# 查看所有路由
curl http://localhost:3000/api/routes

# 查看特定路由
curl http://localhost:3000/api/routes/auth
```

### 熔断器管理
```bash
# 查看熔断器状态
curl http://localhost:3000/api/circuit-breaker/status

# 重置特定服务熔断器
curl -X POST http://localhost:3000/api/circuit-breaker/reset/service-name

# 强制打开熔断器
curl -X POST http://localhost:3000/api/circuit-breaker/open/service-name
```

### 负载均衡策略
```bash
# 查看当前策略
curl http://localhost:3000/api/loadbalancer/strategies

# 修改服务策略
curl -X PUT http://localhost:3000/api/loadbalancer/strategy/service-name/weightedRandom
```

## 日志管理

### 日志级别
- DEBUG: 详细调试信息
- INFO: 一般信息
- WARN: 警告信息
- ERROR: 错误信息

### 日志格式
```json
{
  "timestamp": "2026-04-21T10:30:00.000Z",
  "level": "INFO",
  "context": "RouterService",
  "message": "Request routed successfully",
  "requestId": "uuid",
  "traceId": "uuid"
}
```

## 告警规则

### 熔断器打开告警
```yaml
alert: CircuitBreakerOpen
expr: gateway_circuit_breaker_state{state="open"} == 1
for: 1m
labels:
  severity: critical
annotations:
  summary: "服务熔断器已打开"
  description: "服务 {{ $labels.service }} 的熔断器已打开超过1分钟"
```

### 高错误率告警
```yaml
alert: HighErrorRate
expr: rate(gateway_requests_failed[5m]) / rate(gateway_requests_total[5m]) > 0.05
for: 2m
labels:
  severity: warning
annotations:
  summary: "错误率过高"
  description: "服务错误率超过 5%"
```

### 响应时间告警
```yaml
alert: HighLatency
expr: histogram_quantile(0.95, rate(gateway_response_time_bucket[5m])) > 1000
for: 5m
labels:
  severity: warning
annotations:
  summary: "响应时间过高"
  description: "95%分位响应时间超过1秒"
```

## 备份与恢复

### 配置备份
```bash
# 备份路由配置
curl http://localhost:3000/api/routes > routes-backup.json

# 备份负载均衡配置
curl http://localhost:3000/api/loadbalancer/strategies > strategies-backup.json
```

### 配置恢复
```bash
# 恢复路由配置
curl -X POST -H "Content-Type: application/json" \
  -d @routes-backup.json \
  http://localhost:3000/api/routes/restore
```

## 升级流程

### 1. 停止旧实例
```bash
docker-compose stop gateway
```

### 2. 备份配置
```bash
docker cp gateway:/app/config ./config-backup
```

### 3. 部署新版本
```bash
docker-compose pull gateway
docker-compose up -d gateway
```

### 4. 验证升级
```bash
curl http://localhost:3000/api/health
```

## 性能基准

### 性能指标要求
- 吞吐量: > 10000 req/s
- 平均响应时间: < 50ms
- 99分位响应时间: < 200ms
- 并发连接数: > 10000

### 压测命令
```bash
# 使用 wrk 进行压测
wrk -t4 -c100 -d30s http://localhost:3000/api/health
```
