import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from '../src/circuit-breaker/circuit-breaker.service';
import { ConfigService } from '@nestjs/config';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                CIRCUIT_BREAKER_THRESHOLD: 5,
                CIRCUIT_BREAKER_RESET_TIMEOUT: 30000,
                CIRCUIT_BREAKER_HALF_OPEN_REQUESTS: 1,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('circuit states', () => {
    it('should start in closed state', () => {
      const isOpen = service.isOpen('test-service');
      expect(isOpen).toBe(false);
    });

    it('should record failures', () => {
      service.recordFailure('test-service');
      const circuit = service.getCircuitState('test-service');
      expect(circuit.failureCount).toBe(1);
    });

    it('should open after threshold failures', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-service-open');
      }
      const isOpen = service.isOpen('test-service-open');
      expect(isOpen).toBe(true);
    });

    it('should record successes', () => {
      service.recordSuccess('test-service');
      const circuit = service.getCircuitState('test-service');
      expect(circuit.failureCount).toBe(0);
    });
  });

  describe('state transitions', () => {
    it('should reset circuit', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailure('test-service-reset');
      }
      service.resetCircuit('test-service-reset');
      const circuit = service.getCircuitState('test-service-reset');
      expect(circuit.state).toBe('CLOSED');
    });

    it('should force open circuit', () => {
      service.forceOpen('test-service-force');
      const circuit = service.getCircuitState('test-service-force');
      expect(circuit.state).toBe('OPEN');
    });
  });

  describe('getAllCircuits', () => {
    it('should return all circuits', () => {
      service.recordFailure('service1');
      service.recordFailure('service2');
      const circuits = service.getAllCircuits();
      expect(circuits.length).toBeGreaterThan(0);
    });
  });
});
