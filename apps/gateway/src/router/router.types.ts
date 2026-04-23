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
  pathRewrite?: PathRewriteRule;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  loadBalancer?: 'roundRobin' | 'weightedRandom' | 'weightedRoundRobin';
  metadata?: Record<string, string>;
}

export interface PathRewriteRule {
  pattern: string;
  replacement: string;
}

export interface RouteMatchResult {
  matched: boolean;
  rule?: RouteRule;
  params?: Record<string, string>;
}
