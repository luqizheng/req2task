import type { AIChatMessage } from './message';

export interface DataMapping {
  [key: string]: string | DataMapping;
}

export interface AdapterOptions {
  mapping?: DataMapping;
  defaultValues?: Record<string, unknown>;
  requiredFields?: string[];
}

export interface MessageAdapter {
  name: string;
  toStandard: (externalMessage: unknown, options?: AdapterOptions) => AIChatMessage;
  fromStandard: (standardMessage: AIChatMessage, options?: AdapterOptions) => unknown;
  transformRequest?: (request: unknown, options?: AdapterOptions) => unknown;
  transformResponse?: (response: unknown, options?: AdapterOptions) => unknown;
}

export interface AdapterRegistry {
  register: (adapter: MessageAdapter) => void;
  unregister: (name: string) => void;
  get: (name: string) => MessageAdapter | undefined;
  getAll: () => MessageAdapter[];
  toStandard: (name: string, externalMessage: unknown, options?: AdapterOptions) => AIChatMessage;
  fromStandard: (name: string, standardMessage: AIChatMessage, options?: AdapterOptions) => unknown;
  transformRequest: (name: string, request: unknown, options?: AdapterOptions) => unknown;
  transformResponse: (name: string, response: unknown, options?: AdapterOptions) => unknown;
}
