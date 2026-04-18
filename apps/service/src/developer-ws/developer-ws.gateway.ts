import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RunnerManagerService } from './runner-manager.service';
import { DeveloperSessionService } from './developer-session.service';

interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class DeveloperWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeveloperWsGateway.name);

  constructor(
    private readonly runnerManager: RunnerManagerService,
    private readonly developerSession: DeveloperSessionService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.runnerManager.onClientDisconnect(client.id);
    this.developerSession.onClientDisconnect(client.id);
  }

  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    const type = payload.type as string;

    if (type === 'runner') {
      return this.runnerManager.register(client, payload);
    } else if (type === 'developer') {
      return this.developerSession.register(client, payload);
    }

    return { type: 'error', payload: { code: 'INVALID_TYPE', message: 'Unknown registration type' } };
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    const { type } = payload as { type: string };

    if (type === 'runner') {
      return this.runnerManager.handleHeartbeat(client.id, payload);
    }

    return { type: 'ack', payload: { received: true } };
  }

  @SubscribeMessage('container.create')
  async handleContainerCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.runnerManager.createContainer(client.id, payload);
  }

  @SubscribeMessage('container.start')
  async handleContainerStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.runnerManager.startContainer(client.id, payload);
  }

  @SubscribeMessage('container.stop')
  async handleContainerStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.runnerManager.stopContainer(client.id, payload);
  }

  @SubscribeMessage('container.remove')
  async handleContainerRemove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.runnerManager.removeContainer(client.id, payload);
  }

  @SubscribeMessage('terminal')
  async handleTerminal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.developerSession.handleTerminal(client.id, payload);
  }

  @SubscribeMessage('credential')
  async handleCredential(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.developerSession.handleCredential(client.id, payload);
  }

  @SubscribeMessage('task')
  async handleTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.developerSession.handleTask(client.id, payload);
  }

  @SubscribeMessage('assist')
  async handleAssist(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Record<string, unknown>,
  ) {
    return this.developerSession.handleAssist(client.id, payload);
  }

  sendToRunner(runnerId: string, message: WebSocketMessage) {
    this.runnerManager.sendMessage(runnerId, message);
  }

  sendToDeveloper(containerId: string, message: WebSocketMessage) {
    this.developerSession.sendMessage(containerId, message);
  }

  getRunnerCount(): number {
    return this.runnerManager.getRunnerCount();
  }

  getDeveloperCount(): number {
    return this.developerSession.getSessionCount();
  }
}
