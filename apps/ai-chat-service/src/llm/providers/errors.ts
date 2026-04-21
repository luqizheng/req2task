import { LLMProviderType } from '@req2task/dto';

export enum LLMErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONTEXT_LENGTH_ERROR = 'CONTEXT_LENGTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: LLMErrorCode,
    public readonly statusCode?: number,
    public readonly provider?: LLMProviderType,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
