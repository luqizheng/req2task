const THRESHOLD = 5;
const RESET_MS = 60000;

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private readonly breaker: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTime: 0,
    state: 'closed',
  };

  isOpen(): boolean {
    if (this.breaker.state === 'closed') return false;

    const now = Date.now();
    if (now - this.breaker.lastFailureTime > RESET_MS) {
      this.breaker.state = 'half-open';
      this.breaker.failureCount = 0;
      return false;
    }

    return this.breaker.state === 'open';
  }

  recordFailure(): void {
    this.breaker.failureCount++;
    this.breaker.lastFailureTime = Date.now();

    if (this.breaker.failureCount >= THRESHOLD) {
      this.breaker.state = 'open';
    }
  }

  recordSuccess(): void {
    this.breaker.failureCount = 0;
    this.breaker.state = 'closed';
  }
}
