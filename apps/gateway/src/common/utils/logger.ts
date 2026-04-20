import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends ConsoleLogger {
  private requestId?: string;

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  log(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const requestInfo = this.requestId ? `[${this.requestId}]` : '';
    console.log(`[${timestamp}]${requestInfo} [${context || 'INFO'}] ${message}`);
    super.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    const timestamp = new Date().toISOString();
    const requestInfo = this.requestId ? `[${this.requestId}]` : '';
    console.error(`[${timestamp}]${requestInfo} [${context || 'ERROR'}] ${message}`, trace || '');
    super.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const requestInfo = this.requestId ? `[${this.requestId}]` : '';
    console.warn(`[${timestamp}]${requestInfo} [${context || 'WARN'}] ${message}`);
    super.warn(message, context);
  }

  debug(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const requestInfo = this.requestId ? `[${this.requestId}]` : '';
    console.debug(`[${timestamp}]${requestInfo} [${context || 'DEBUG'}] ${message}`);
    super.debug(message, context);
  }

  static generateRequestId(): string {
    return uuidv4();
  }
}
