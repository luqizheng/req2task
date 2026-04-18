import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface RunnerInfo {
  clientId: string;
  runnerId: string;
  hostname: string;
  capabilities: RunnerCapabilities;
  systemInfo: SystemInfo;
  containers: ContainerInfo[];
  lastHeartbeat: Date;
}

interface RunnerCapabilities {
  docker_available: boolean;
  docker_version?: string;
  max_containers: number;
  supported_bots: string[];
}

interface SystemInfo {
  os: string;
  os_version: string;
  arch: string;
  ip_address: string;
  cpu_count: number;
  memory_total: number;
  disk_total: number;
}

interface ContainerInfo {
  container_id: string;
  bot_type: string;
  status: string;
  ports: PortMapping[];
}

interface PortMapping {
  internal: number;
  external: number;
  protocol: string;
}

@Injectable()
export class RunnerManagerService {
  private readonly logger = new Logger(RunnerManagerService.name);
  private runners = new Map<string, RunnerInfo>();
  private clientToRunner = new Map<string, string>();

  register(client: Socket, payload: Record<string, unknown>) {
    const runnerId = payload.runner_id as string;
    const capabilities = payload.capabilities as RunnerCapabilities;
    const systemInfo = payload.system_info as SystemInfo;

    const runner: RunnerInfo = {
      clientId: client.id,
      runnerId,
      hostname: payload.hostname as string,
      capabilities,
      systemInfo,
      containers: [],
      lastHeartbeat: new Date(),
    };

    this.runners.set(runnerId, runner);
    this.clientToRunner.set(client.id, runnerId);

    this.logger.log(`Runner registered: ${runnerId} from ${runner.hostname}`);

    return {
      type: 'ack',
      payload: {
        runner_id: runnerId,
        status: 'registered',
        message: 'Runner registered successfully',
      },
    };
  }

  handleHeartbeat(clientId: string, payload: Record<string, unknown>) {
    const runnerId = this.clientToRunner.get(clientId);
    if (!runnerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Runner not found' } };
    }

    const runner = this.runners.get(runnerId);
    if (runner) {
      runner.lastHeartbeat = new Date();
      runner.containers = (payload.containers as ContainerInfo[]) || [];

      return {
        type: 'heartbeat_ack',
        payload: {
          runner_id: runnerId,
          timestamp: Date.now(),
        },
      };
    }

    return { type: 'error', payload: { code: 'RUNNER_NOT_FOUND', message: 'Runner not found' } };
  }

  async createContainer(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const runnerId = this.clientToRunner.get(clientId);
    if (!runnerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Runner not found' } };
    }

    this.logger.log(`Creating container on runner ${runnerId}: ${payload.container_id}`);

    return {
      type: 'container.created',
      payload: {
        container_id: payload.container_id,
        status: 'created',
        ports: payload.ports || [],
      },
    };
  }

  async startContainer(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const runnerId = this.clientToRunner.get(clientId);
    if (!runnerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Runner not found' } };
    }

    this.logger.log(`Starting container on runner ${runnerId}: ${payload.container_id}`);

    return {
      type: 'container.started',
      payload: {
        container_id: payload.container_id,
        status: 'running',
      },
    };
  }

  async stopContainer(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const runnerId = this.clientToRunner.get(clientId);
    if (!runnerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Runner not found' } };
    }

    this.logger.log(`Stopping container on runner ${runnerId}: ${payload.container_id}`);

    return {
      type: 'container.stopped',
      payload: {
        container_id: payload.container_id,
      },
    };
  }

  async removeContainer(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const runnerId = this.clientToRunner.get(clientId);
    if (!runnerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: ' ' } };
    }

    this.logger.log(`Removing container on runner ${runnerId}: ${payload.container_id}`);

    return {
      type: 'container.removed',
      payload: {
        container_id: payload.container_id,
      },
    };
  }

  sendMessage(runnerId: string, message: { type: string; payload: Record<string, unknown> }) {
    const runner = this.runners.get(runnerId);
    if (runner) {
      // The actual message sending would be handled by the gateway
      this.logger.debug(`Message queued for runner ${runnerId}: ${message.type}`);
    }
  }

  onClientDisconnect(clientId: string) {
    const runnerId = this.clientToRunner.get(clientId);
    if (runnerId) {
      this.runners.delete(runnerId);
      this.clientToRunner.delete(clientId);
      this.logger.log(`Runner disconnected: ${runnerId}`);
    }
  }

  getRunner(runnerId: string): RunnerInfo | undefined {
    return this.runners.get(runnerId);
  }

  getAllRunners(): RunnerInfo[] {
    return Array.from(this.runners.values());
  }

  getRunnerCount(): number {
    return this.runners.size;
  }

  getAvailableRunners(): RunnerInfo[] {
    return this.getAllRunners().filter(
      (r) => r.containers.length < r.capabilities.max_containers,
    );
  }

  findBestRunner(botType: string): RunnerInfo | undefined {
    const available = this.getAvailableRunners();
    const compatible = available.filter((r) =>
      r.capabilities.supported_bots.includes(botType),
    );

    if (compatible.length === 0) return undefined;

    return compatible.reduce((best, current) =>
      current.containers.length < best.containers.length ? current : best,
    );
  }
}
