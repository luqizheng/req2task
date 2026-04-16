export class AdapterError extends Error {
  constructor(message: string, public code: string, public details?: unknown) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class MappingError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'MAPPING_ERROR', details);
    this.name = 'MappingError';
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, public missingFields?: string[], details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class TransformationError extends AdapterError {
  constructor(message: string, details?: unknown) {
    super(message, 'TRANSFORMATION_ERROR', details);
    this.name = 'TransformationError';
  }
}

export function handleAdapterError(error: unknown, fallback: unknown): unknown {
  if (error instanceof AdapterError) {
    console.error(`Adapter error [${error.code}]: ${error.message}`, error.details);
  } else if (error instanceof Error) {
    console.error('Unexpected adapter error:', error.message);
  } else {
    console.error('Unknown adapter error:', error);
  }
  return fallback;
}

export function validateAdapterInput(input: unknown, requiredFields: string[]): void {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }
  
  const missingFields = requiredFields.filter(field => 
    (input as Record<string, unknown>)[field] === undefined
  );
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    );
  }
}