import type { MessageAdapter, AdapterRegistry, AdapterOptions, DataMapping } from '../types/adapter';
import type { AIChatMessage, MessageRole } from '../types';
import { generateId } from '../utils/id-generator';
import { handleAdapterError, validateAdapterInput, ValidationError } from '../utils/error-handler';
import { validateRequiredFields } from '../utils/data-mapper';


const adapters = new Map<string, MessageAdapter>();

function applyMapping(data: Record<string, unknown>, mapping: DataMapping): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(mapping)) {
    if (typeof value === 'string') {
      if (data[value] !== undefined) {
        result[key] = data[value];
      }
    } else {
      const nestedData = data[Object.keys(value)[0]] as Record<string, unknown>;
      if (nestedData) {
        result[key] = applyMapping(nestedData, value as DataMapping);
      }
    }
  }
  
  return result;
}

function applyDefaultValues(data: Record<string, unknown>, defaultValues: Record<string, unknown>): Record<string, unknown> {
  return {
    ...defaultValues,
    ...data,
  };
}

export const defaultAdapter: MessageAdapter = {
  name: 'default',
  toStandard: (externalMessage: unknown, options?: AdapterOptions): AIChatMessage => {
    try {
      let msg = externalMessage as Record<string, unknown>;
      
      if (options?.mapping) {
        msg = applyMapping(msg, options.mapping);
      }
      
      if (options?.defaultValues) {
        msg = applyDefaultValues(msg, options.defaultValues);
      }
      
      const role = (msg.role as MessageRole) || 'user';
      const content = (msg.content as string) || '';

      return {
        id: (msg.id as string) || generateId(),
        role,
        content,
        createdAt: msg.createdAt
          ? new Date(msg.createdAt as string | Date)
          : new Date(),
        status: (msg.status as AIChatMessage['status']) || 'done',
        roleName: msg.roleName as string | undefined,
        avatar: msg.avatar as string | undefined,
        metadata: msg.metadata as AIChatMessage['metadata'],
      };
    } catch (error) {
      console.error('Error converting to standard message:', error);
      return {
        id: generateId(),
        role: 'user',
        content: '',
        createdAt: new Date(),
        status: 'error',
      };
    }
  },
  fromStandard: (standardMessage: AIChatMessage, options?: AdapterOptions): unknown => {
    try {
      let result: Record<string, unknown> = {
        id: standardMessage.id,
        role: standardMessage.role,
        content: standardMessage.content,
        createdAt: standardMessage.createdAt.toISOString(),
        status: standardMessage.status,
        roleName: standardMessage.roleName,
        avatar: standardMessage.avatar,
        metadata: standardMessage.metadata,
      };
      
      if (options?.mapping) {
        result = applyMapping(result, options.mapping);
      }
      
      if (options?.defaultValues) {
        result = applyDefaultValues(result, options.defaultValues);
      }
      
      return result;
    } catch (error) {
      console.error('Error converting from standard message:', error);
      return {};
    }
  },
  transformRequest: (request: unknown, options?: AdapterOptions): unknown => {
    try {
      validateAdapterInput(request, []);
      
      let transformedRequest = request as Record<string, unknown>;
      
      if (options?.mapping) {
        transformedRequest = applyMapping(transformedRequest, options.mapping);
      }
      
      if (options?.defaultValues) {
        transformedRequest = applyDefaultValues(transformedRequest, options.defaultValues);
      }
      
      if (options?.requiredFields) {
        const missingFields = validateRequiredFields(transformedRequest, options.requiredFields);
        if (missingFields.length > 0) {
          throw new ValidationError(
            `Missing required fields: ${missingFields.join(', ')}`,
            missingFields
          );
        }
      }
      
      return transformedRequest;
    } catch (error) {
      return handleAdapterError(error, request);
    }
  },
  transformResponse: (response: unknown, options?: AdapterOptions): unknown => {
    try {
      let transformedResponse = response as Record<string, unknown>;
      
      if (options?.mapping) {
        transformedResponse = applyMapping(transformedResponse, options.mapping);
      }
      
      if (options?.defaultValues) {
        transformedResponse = applyDefaultValues(transformedResponse, options.defaultValues);
      }
      
      return transformedResponse;
    } catch (error) {
      console.error('Error transforming response:', error);
      return response;
    }
  },
};

adapters.set(defaultAdapter.name, defaultAdapter);

export function registerAdapter(adapter: MessageAdapter): void {
  if (adapters.has(adapter.name)) {
    console.warn(`Adapter "${adapter.name}" is already registered. It will be overwritten.`);
  }
  adapters.set(adapter.name, adapter);
}

export function unregisterAdapter(name: string): void {
  if (name === 'default') {
    console.warn('Cannot unregister the default adapter.');
    return;
  }
  adapters.delete(name);
}

export function getAdapter(name: string): MessageAdapter | undefined {
  return adapters.get(name);
}

export function getAllAdapters(): MessageAdapter[] {
  return Array.from(adapters.values());
}

export function toStandard(name: string, externalMessage: unknown, options?: AdapterOptions): AIChatMessage {
  const adapter = adapters.get(name);
  if (!adapter) {
    console.warn(`Adapter "${name}" not found. Using default adapter.`);
    return defaultAdapter.toStandard(externalMessage, options);
  }
  return adapter.toStandard(externalMessage, options);
}

export function fromStandard(name: string, standardMessage: AIChatMessage, options?: AdapterOptions): unknown {
  const adapter = adapters.get(name);
  if (!adapter) {
    console.warn(`Adapter "${name}" not found. Using default adapter.`);
    return defaultAdapter.fromStandard(standardMessage, options);
  }
  return adapter.fromStandard(standardMessage, options);
}

export function transformRequest(name: string, request: unknown, options?: AdapterOptions): unknown {
  const adapter = adapters.get(name);
  if (!adapter || !adapter.transformRequest) {
    console.warn(`Adapter "${name}" not found or does not have transformRequest method. Using default adapter.`);
    return defaultAdapter.transformRequest?.(request, options) || request;
  }
  return adapter.transformRequest(request, options);
}

export function transformResponse(name: string, response: unknown, options?: AdapterOptions): unknown {
  const adapter = adapters.get(name);
  if (!adapter || !adapter.transformResponse) {
    console.warn(`Adapter "${name}" not found or does not have transformResponse method. Using default adapter.`);
    return defaultAdapter.transformResponse?.(response, options) || response;
  }
  return adapter.transformResponse(response, options);
}

export const adapterRegistry: AdapterRegistry = {
  register: registerAdapter,
  unregister: unregisterAdapter,
  get: getAdapter,
  getAll: getAllAdapters,
  toStandard,
  fromStandard,
  transformRequest,
  transformResponse,
};
