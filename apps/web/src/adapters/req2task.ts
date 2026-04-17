import type { MessageAdapter, AdapterOptions, DataMapping } from '@req2task/ai-chat';
import type { AIChatMessage, MessageRole } from '@req2task/ai-chat';
import { generateId } from '@req2task/ai-chat';

interface Req2TaskChatResponse {
  code: number;
  data?: {
    content: string;
    configId?: string;
  };
  message?: string;
}

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

function applyDefaultValues(
  data: Record<string, unknown>,
  defaultValues: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...defaultValues,
    ...data,
  };
}

export const req2taskAdapter: MessageAdapter = {
  name: 'req2task',

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
        createdAt: msg.createdAt ? new Date(msg.createdAt as string | Date) : new Date(),
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
      const req = request as Record<string, unknown>;

      let transformedRequest: Record<string, unknown> = {
        message: req.message || req.content || '',
      };

      if (req.sessionId) {
        transformedRequest.sessionId = req.sessionId;
      }

      if (req.conversationId) {
        transformedRequest.conversationId = req.conversationId;
      }

      if (options?.mapping) {
        transformedRequest = applyMapping(transformedRequest, options.mapping);
      }

      if (options?.defaultValues) {
        transformedRequest = applyDefaultValues(transformedRequest, options.defaultValues);
      }

      return transformedRequest;
    } catch (error) {
      console.error('Error transforming request:', error);
      return request;
    }
  },

  transformResponse: (response: unknown, _options?: AdapterOptions): unknown => {
    try {
      const res = response as Record<string, unknown>;

      if (res.code !== 0) {
        return {
          type: 'error',
          error: res.message || 'Unknown error',
        };
      }

      const data = res.data as Req2TaskChatResponse['data'];

      if (!data) {
        return {
          type: 'content',
          content: '',
        };
      }

      if (data.content) {
        return {
          type: 'content',
          content: data.content,
        };
      }

      return {
        type: 'content',
        content: '',
      };
    } catch (error) {
      console.error('Error transforming response:', error);
      return response;
    }
  },
};
