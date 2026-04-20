export interface ServiceInstance {
  instanceId: string;
  ip: string;
  port: number;
  serviceName: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  weight: number;
  enabled: boolean;
  ephemeral: boolean;
  clusterName: string;
  metadata: Record<string, string>;
  lastHeartbeat: number;
}

export interface RouteRule {
  id: string;
  name: string;
  priority: number;
  serviceName: string;
  pathPattern: string;
  methods: string[];
  targetService: string;
  targetPort: number;
  isRegex: boolean;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  loadBalancer?: 'roundRobin' | 'weightedRandom' | 'weightedRoundRobin';
  metadata?: Record<string, string>;
}

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export interface CircuitBreakerState {
  serviceName: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastStateChangeTime: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  uptime: number;
  services: ServiceHealthStatus[];
  metrics: SystemMetrics;
}

export interface ServiceHealthStatus {
  name: string;
  status: 'up' | 'down' | 'unknown';
  instances: InstanceHealthStatus[];
  lastCheck: number;
}

export interface InstanceHealthStatus {
  instanceId: string;
  ip: string;
  port: number;
  status: 'up' | 'down';
  latency?: number;
}

export interface SystemMetrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
  averageResponseTime: number;
  activeConnections: number;
  timestamp: number;
}

export interface NacosConfig {
  serverAddr: string;
  namespace?: string;
  groupName?: string;
  clusterName?: string;
  username?: string;
  password?: string;
  timeout?: number;
  heartbeatInterval?: number;
  heartbeatRetry?: number;
}

export interface LoadBalancerStrategy {
  select(instances: ServiceInstance[]): ServiceInstance | null;
}

export interface TracingContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  timestamp: number;
  duration?: number;
  tags?: Record<string, string>;
}

export interface ConfigChange {
  configId: string;
  configType: 'route' | 'loadbalancer' | 'circuitbreaker' | 'general';
  oldValue: any;
  newValue: any;
  timestamp: number;
  version: number;
}
