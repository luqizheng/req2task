import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../common/utils/logger';

export interface TraceInfo {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  timestamp: number;
  path: string;
  method: string;
  statusCode?: number;
  duration?: number;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger('Tracing');
  private readonly traces: TraceInfo[] = [];
  private readonly maxTraces = 500;
  private currentTraceId: string | null = null;

  generateRequestId(): string {
    return uuidv4();
  }

  generateTraceId(): string {
    return uuidv4();
  }

  generateSpanId(): string {
    return uuidv4().substring(0, 16);
  }

  setTraceId(traceId: string): void {
    this.currentTraceId = traceId;
  }

  getTraceId(): string {
    return this.currentTraceId || this.generateTraceId();
  }

  recordTrace(trace: TraceInfo): void {
    this.traces.push(trace);
    if (this.traces.length > this.maxTraces) {
      this.traces.shift();
    }
  }

  getRecentTraces(limit = 100): TraceInfo[] {
    return this.traces.slice(-limit);
  }

  clearTraces(): void {
    this.traces.length = 0;
  }
}

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  constructor(private readonly tracingService: TracingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const traceId = (req.headers['x-trace-id'] as string) || this.tracingService.generateTraceId();
    const spanId = this.tracingService.generateSpanId();
    const parentSpanId = req.headers['x-span-id'] as string;

    req.headers['x-trace-id'] = traceId;
    req.headers['x-span-id'] = spanId;

    this.tracingService.setTraceId(traceId);

    const startTime = Date.now();
    const traceInfo: TraceInfo = {
      traceId,
      spanId,
      parentSpanId,
      timestamp: startTime,
      path: req.path,
      method: req.method,
    };

    res.on('finish', () => {
      traceInfo.statusCode = res.statusCode;
      traceInfo.duration = Date.now() - startTime;
      this.tracingService.recordTrace(traceInfo);
    });

    next();
  }
}
