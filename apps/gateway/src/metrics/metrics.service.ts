import { Injectable } from '@nestjs/common';
import { Logger } from '../common/utils/logger';
import { SystemMetrics } from '../common/types';

interface MetricSample {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('Metrics');
  private readonly metrics: Map<string, MetricSample[]> = new Map();
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly histograms = new Map<string, number[]>();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    this.recordMetric(name, current + 1, labels);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
    this.recordMetric(name, value, labels);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
    this.recordMetric(name, value, labels);
  }

  private recordMetric(name: string, value: number, labels: Record<string, string>): void {
    const sample: MetricSample = {
      name,
      value,
      timestamp: Date.now(),
      labels,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(sample);
    
    const maxSamples = 1000;
    if (existing.length > maxSamples) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
  }

  private getKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  getPrometheusMetrics(): string {
    const lines: string[] = [];

    lines.push('# HELP gateway_uptime Gateway uptime in seconds');
    lines.push('# TYPE gateway_uptime gauge');
    lines.push(`gateway_uptime ${Math.floor((Date.now() - this.startTime) / 1000)}`);

    this.counters.forEach((value, key) => {
      const name = key.split('{')[0];
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${key} ${value}`);
    });

    this.gauges.forEach((value, key) => {
      const name = key.split('{')[0];
      lines.push(`# HELP ${name} Gauge metric`);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${key} ${value}`);
    });

    this.histograms.forEach((values, key) => {
      if (values.length === 0) return;
      
      const name = key.split('{')[0];
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const avg = sum / count;
      
      values.sort((a, b) => a - b);
      const p50 = values[Math.floor(values.length * 0.5)];
      const p90 = values[Math.floor(values.length * 0.9)];
      const p99 = values[Math.floor(values.length * 0.99)];

      lines.push(`# HELP ${name} Histogram metric`);
      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${key}_sum ${sum}`);
      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_avg ${avg}`);
      lines.push(`${key}_p50 ${p50}`);
      lines.push(`${key}_p90 ${p90}`);
      lines.push(`${key}_p99 ${p99}`);
    });

    return lines.join('\n');
  }

  getSystemMetrics(): SystemMetrics {
    const totalRequests = this.counters.get('requests_total') || 0;
    const successRequests = this.counters.get('requests_success') || 0;
    const failedRequests = this.counters.get('requests_failed') || 0;

    const responseTimes = this.histograms.get('response_time') || [];
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      requestsTotal: totalRequests,
      requestsSuccess: successRequests,
      requestsFailed: failedRequests,
      averageResponseTime: avgResponseTime,
      activeConnections: this.gauges.get('active_connections') || 0,
      timestamp: Date.now(),
    };
  }

  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.metrics.clear();
    this.startTime = Date.now();
  }
}
