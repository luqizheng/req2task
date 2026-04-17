export class BusinessException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'BUSINESS_ERROR',
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'BusinessException';
  }
}

export class NotFoundException extends BusinessException {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundException';
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationException';
  }
}