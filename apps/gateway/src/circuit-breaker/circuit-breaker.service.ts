import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../common/utils/logger';
import { CircuitBreakerState } from '../common/types';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private readonly logger = new Logger('CircuitBreaker');
  private readonly circuits = new Map<string, CircuitBreakerState>();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenRequests: number;
  private halfOpenCounters = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {
    this.failureThreshold = this.configService.get('CIRCUIT_BREAKER_THRESHOLD', 5);
    this.resetTimeout = this.configService.get('CIRCUIT_BREAKER_RESET_TIMEOUT', 30000);
    this.halfOpenRequests = this.configService.get('CIRCUIT_BREAKER_HALF_OPEN_REQUESTS', 1);
  }

  async onModuleInit() {
    await this.loadConfig();
  }

  private async loadConfig() {
    try {
      const configStr = process.env.CIRCUIT_BREAKER_CONFIG;
      if (configStr) {
        const config = JSON.parse(configStr);
        if (config.failureThreshold) this.failureThreshold;
        if (config.resetTimeout) this.resetTimeout;
        if (config.halfOpenRequests) this.halfOpenRequests;
        this.logger.log('熔断器配置加载成功');
      }
    } catch (error) {
      this.logger.warn(`加载熔断器配置失败: ${error.message}，使用默认值`);
    }
  }

  private getCircuit(serviceName: string): CircuitBreakerState {
    let circuit = this.circuits.get(serviceName);
    if (!circuit) {
      circuit = {
        serviceName,
        state: 'CLOSED',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: 0,
        lastStateChangeTime: Date.now(),
      };
      this.circuits.set(serviceName, circuit);
    }
    return circuit;
  }

  isOpen(serviceName: string): boolean {
    const circuit = this.getCircuit(serviceName);
    
    if (circuit.state === 'CLOSED') {
      return false;
    }

    if (circuit.state === 'OPEN') {
      const elapsed = Date.now() - circuit.lastStateChangeTime;
      if (elapsed >= this.resetTimeout) {
        this.transitionToHalfOpen(serviceName);
        return false;
      }
      return true;
    }

    if (circuit.state === 'HALF_OPEN') {
      const count = this.halfOpenCounters.get(serviceName) || 0;
      if (count >= this.halfOpenRequests) {
        return true;
      }
      return false;
    }

    return false;
  }

  recordSuccess(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);

    if (circuit.state === 'HALF_OPEN') {
      circuit.successCount++;
      if (circuit.successCount >= this.halfOpenRequests) {
        this.transitionToClosed(serviceName);
      }
    } else if (circuit.state === 'CLOSED') {
      circuit.failureCount = Math.max(0, circuit.failureCount - 1);
    }
  }

  recordFailure(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);

    if (circuit.state === 'HALF_OPEN') {
      this.transitionToOpen(serviceName);
      return;
    }

    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failureCount >= this.failureThreshold) {
      this.transitionToOpen(serviceName);
    }
  }

  private transitionToOpen(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    const previousState = circuit.state;
    
    circuit.state = 'OPEN';
    circuit.lastStateChangeTime = Date.now();
    circuit.successCount = 0;
    
    this.halfOpenCounters.delete(serviceName);
    
    this.logger.warn(`熔断器打开: ${serviceName} (从 ${previousState})`);
    
    setTimeout(() => {
      if (this.circuits.get(serviceName)?.state === 'OPEN') {
        this.transitionToHalfOpen(serviceName);
      }
    }, this.resetTimeout);
  }

  private transitionToHalfOpen(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    const previousState = circuit.state;
    
    circuit.state = 'HALF_OPEN';
    circuit.lastStateChangeTime = Date.now();
    circuit.failureCount = 0;
    circuit.successCount = 0;
    this.halfOpenCounters.set(serviceName, 0);
    
    this.logger.log(`熔断器进入半开状态: ${serviceName} (从 ${previousState})`);
  }

  private transitionToClosed(serviceName: string): void {
    const circuit = this.getCircuit(serviceName);
    const previousState = circuit.state;
    
    circuit.state = 'CLOSED';
    circuit.lastStateChangeTime = Date.now();
    circuit.failureCount = 0;
    circuit.successCount = 0;
    this.halfOpenCounters.delete(serviceName);
    
    this.logger.log(`熔断器关闭: ${serviceName} (从 ${previousState})`);
  }

  getCircuitState(serviceName: string): CircuitBreakerState {
    return this.getCircuit(serviceName);
  }

  getAllCircuits(): CircuitBreakerState[] {
    return Array.from(this.circuits.values());
  }

  resetCircuit(serviceName: string): void {
    this.transitionToClosed(serviceName);
  }

  forceOpen(serviceName: string): void {
    this.transitionToOpen(serviceName);
  }

  incrementHalfOpenCounter(serviceName: string): number {
    const count = (this.halfOpenCounters.get(serviceName) || 0) + 1;
    this.halfOpenCounters.set(serviceName, count);
    return count;
  }
}
