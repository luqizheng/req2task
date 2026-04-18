import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface DeveloperSession {
  clientId: string;
  containerId: string;
  botType: string;
  version: string;
  capabilities: string[];
  status: 'initializing' | 'ready' | 'busy' | 'error';
  lastHeartbeat: Date;
}

interface EnvConfig {
  database?: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    type: 'postgresql' | 'mysql' | 'mongodb';
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  services?: Record<string, { url: string; auth?: Record<string, string> }>;
  envVars?: Record<string, string>;
}

@Injectable()
export class DeveloperSessionService {
  private readonly logger = new Logger(DeveloperSessionService.name);
  private sessions = new Map<string, DeveloperSession>();
  private clientToSession = new Map<string, string>();
  private pendingCredentials = new Map<string, Record<string, unknown>>();

  register(client: Socket, payload: Record<string, unknown>) {
    const containerId = payload.container_id as string;
    const botType = payload.bot_type as string;

    const session: DeveloperSession = {
      clientId: client.id,
      containerId,
      botType,
      version: payload.version as string || '1.0.0',
      capabilities: (payload.capabilities as string[]) || [],
      status: 'initializing',
      lastHeartbeat: new Date(),
    };

    this.sessions.set(containerId, session);
    this.clientToSession.set(client.id, containerId);

    this.logger.log(`Developer session registered: ${containerId} (${botType})`);

    return {
      type: 'ack',
      payload: {
        container_id: containerId,
        status: 'registered',
        message: 'Developer session registered successfully',
      },
    };
  }

  handleHeartbeat(clientId: string, payload: Record<string, unknown>) {
    const containerId = this.clientToSession.get(clientId);
    if (!containerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const session = this.sessions.get(containerId);
    if (session) {
      session.lastHeartbeat = new Date();
      if (payload.status) {
        session.status = payload.status as DeveloperSession['status'];
      }

      return {
        type: 'heartbeat_ack',
        payload: {
          container_id: containerId,
          timestamp: Date.now(),
        },
      };
    }

    return { type: 'error', payload: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } };
  }

  async handleTerminal(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const containerId = this.clientToSession.get(clientId);
    if (!containerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const action = payload.action as string;

    switch (action) {
      case 'connect':
        return {
          type: 'terminal.ready',
          payload: {
            container_id: containerId,
            shell: '/bin/bash',
          },
        };

      case 'input':
        this.logger.debug(`Terminal input for ${containerId}: ${payload.data}`);
        return { type: 'ack', payload: { received: true } };

      case 'resize':
        return { type: 'ack', payload: { received: true } };

      case 'disconnect':
        return { type: 'ack', payload: { received: true } };

      default:
        return { type: 'error', payload: { code: 'INVALID_ACTION', message: 'Unknown action' } };
    }
  }

  async handleCredential(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const containerId = this.clientToSession.get(clientId);
    if (!containerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const credType = payload.type as string;
    this.pendingCredentials.set(`${containerId}:${credType}`, payload as Record<string, unknown>);

    this.logger.log(`Credential received for ${containerId}: ${credType}`);

    return {
      type: 'credential.installed',
      payload: {
        container_id: containerId,
        type: credType,
        status: 'installed',
      },
    };
  }

  async handleTask(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const containerId = this.clientToSession.get(clientId);
    if (!containerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const taskId = payload.taskId as string;
    this.logger.log(`Task assigned to ${containerId}: ${taskId}`);

    return {
      type: 'task.assigned',
      payload: {
        taskId,
        container_id: containerId,
        status: 'assigned',
      },
    };
  }

  async handleAssist(
    clientId: string,
    payload: Record<string, unknown>,
  ): Promise<{ type: string; payload: Record<string, unknown> }> {
    const containerId = this.clientToSession.get(clientId);
    if (!containerId) {
      return { type: 'error', payload: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const action = payload.action as string;
    const reason = payload.reason as string;
    const message = payload.message as string;

    this.logger.log(`Assist request from ${containerId}: ${reason} - ${message}`);

    if (action === 'request') {
      return {
        type: 'assist.acknowledged',
        payload: {
          container_id: containerId,
          reason,
          message,
          status: 'pending_review',
        },
      };
    }

    return { type: 'ack', payload: { received: true } };
  }

  sendMessage(containerId: string, message: { type: string; payload: Record<string, unknown> }) {
    const session = this.sessions.get(containerId);
    if (session) {
      this.logger.debug(`Message queued for developer ${containerId}: ${message.type}`);
    }
  }

  onClientDisconnect(clientId: string) {
    const containerId = this.clientToSession.get(clientId);
    if (containerId) {
      this.sessions.delete(containerId);
      this.clientToSession.delete(clientId);
      this.logger.log(`Developer session disconnected: ${containerId}`);
    }
  }

  getSession(containerId: string): DeveloperSession | undefined {
    return this.sessions.get(containerId);
  }

  getAllSessions(): DeveloperSession[] {
    return Array.from(this.sessions.values());
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getReadySessions(): DeveloperSession[] {
    return this.getAllSessions().filter((s) => s.status === 'ready');
  }

  setSessionReady(containerId: string) {
    const session = this.sessions.get(containerId);
    if (session) {
      session.status = 'ready';
      this.logger.log(`Developer session ready: ${containerId}`);
    }
  }

  getPendingCredentials(containerId: string): Record<string, unknown>[] {
    const creds: Record<string, unknown>[] = [];
    for (const [key] of this.pendingCredentials) {
      if (key.startsWith(`${containerId}:`)) {
        creds.push(this.pendingCredentials.get(key)!);
        this.pendingCredentials.delete(key);
      }
    }
    return creds;
  }
}
