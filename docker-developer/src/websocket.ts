import WebSocket from 'ws';
import pino from 'pino';
import { Config, WebSocketMessage } from './types.js';

const logger = pino({ name: 'ws-client' });

export class WsClient {
  private ws: WebSocket | null = null;
  private config: Config;
  private messageHandlers: Map<string, (payload: unknown) => Promise<void>> = new Map();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];

  constructor(config: Config) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `ws://${this.config.websocket.host}:${this.config.websocket.port}${this.config.websocket.path}`;

      logger.info(`Connecting to ${url}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        logger.info('Connected to WebSocket server');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.sendPendingMessages();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        logger.warn('Disconnected from WebSocket server');
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        logger.error({ error }, 'WebSocket error');
        reject(error);
      });
    });
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      logger.debug({ type: message.type }, 'Received message');

      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message.payload).catch((err) => {
          logger.error({ error: err, type: message.type }, 'Handler error');
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to parse message');
    }
  }

  send(type: string, payload: unknown): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now().toString(),
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private sendPendingMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  on(type: string, handler: (payload: unknown) => Promise<void>): void {
    this.messageHandlers.set(type, handler);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send('heartbeat', {
        type: 'developer',
        containerId: this.config.developer.containerId,
        status: 'online',
      });
    }, this.config.websocket.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.websocket.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.websocket.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      300000
    );

    this.reconnectAttempts++;
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((err) => {
        logger.error({ error: err }, 'Reconnection failed');
      });
    }, delay);
  }

  close(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
