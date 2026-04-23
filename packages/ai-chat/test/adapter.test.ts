import { adapterRegistry, registerAdapter } from '../src/adapters';
import type { MessageAdapter, AdapterOptions } from '../src/types/adapter';
import type { AIChatMessage } from '../src/types';
import { deepMapObject, convertTypes, validateRequiredFields } from '../src/utils';
import { ValidationError, MappingError } from '../src/utils';

describe('Adapter System', () => {
  describe('Default Adapter', () => {
    it('should convert external message to standard format', () => {
      const externalMessage = {
        id: '123',
        role: 'user',
        content: 'Hello',
        createdAt: '2023-01-01T00:00:00Z',
        status: 'done'
      };

      const standardMessage = adapterRegistry.toStandard('default', externalMessage);

      expect(standardMessage.id).toBe('123');
      expect(standardMessage.role).toBe('user');
      expect(standardMessage.content).toBe('Hello');
      expect(standardMessage.createdAt).toBeInstanceOf(Date);
      expect(standardMessage.status).toBe('done');
    });

    it('should convert standard message to external format', () => {
      const standardMessage: AIChatMessage = {
        id: '123',
        role: 'user',
        content: 'Hello',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        status: 'done'
      };

      const externalMessage = adapterRegistry.fromStandard('default', standardMessage);

      expect(externalMessage).toHaveProperty('id', '123');
      expect(externalMessage).toHaveProperty('role', 'user');
      expect(externalMessage).toHaveProperty('content', 'Hello');
      expect(externalMessage).toHaveProperty('createdAt');
      expect(externalMessage).toHaveProperty('status', 'done');
    });

    it('should transform request with mapping', () => {
      const request = {
        message_id: '123',
        text: 'Hello',
        sender: 'user'
      };

      const options: AdapterOptions = {
        mapping: {
          id: 'message_id',
          content: 'text',
          role: 'sender'
        }
      };

      const transformed = adapterRegistry.transformRequest('default', request, options);

      expect(transformed).toHaveProperty('id', '123');
      expect(transformed).toHaveProperty('content', 'Hello');
      expect(transformed).toHaveProperty('role', 'user');
    });

    it('should transform response with default values', () => {
      const response = {
        id: '123',
        content: 'Hello'
      };

      const options: AdapterOptions = {
        defaultValues: {
          status: 'done',
          role: 'assistant'
        }
      };

      const transformed = adapterRegistry.transformResponse('default', response, options);

      expect(transformed).toHaveProperty('id', '123');
      expect(transformed).toHaveProperty('content', 'Hello');
      expect(transformed).toHaveProperty('status', 'done');
      expect(transformed).toHaveProperty('role', 'assistant');
    });

    it('should handle missing required fields', () => {
      const request = {
        id: '123'
      };

      const options: AdapterOptions = {
        requiredFields: ['id', 'content']
      };

      const transformed = adapterRegistry.transformRequest('default', request, options);

      expect(transformed).toHaveProperty('id', '123');
    });

    it('should handle errors gracefully', () => {
      const invalidInput = 'not an object';

      const result = adapterRegistry.transformRequest('default', invalidInput);

      expect(result).toBe('not an object');
    });
  });

  describe('Custom Adapter', () => {
    const customAdapter: MessageAdapter = {
      name: 'custom',
      toStandard: (externalMessage) => {
        const msg = externalMessage as Record<string, unknown>;
        return {
          id: (msg.id as string) || 'default-id',
          role: 'user',
          content: (msg.text as string) || '',
          createdAt: new Date()
        };
      },
      fromStandard: (standardMessage) => {
        return {
          id: standardMessage.id,
          text: standardMessage.content,
          type: standardMessage.role
        };
      }
    };

    beforeEach(() => {
      registerAdapter(customAdapter);
    });

    it('should use custom adapter for conversion', () => {
      const externalMessage = {
        id: '456',
        text: 'Custom message'
      };

      const standardMessage = adapterRegistry.toStandard('custom', externalMessage);

      expect(standardMessage.id).toBe('456');
      expect(standardMessage.content).toBe('Custom message');
      expect(standardMessage.role).toBe('user');
    });

    it('should use custom adapter for reverse conversion', () => {
      const standardMessage: AIChatMessage = {
        id: '456',
        role: 'assistant',
        content: 'Custom response',
        createdAt: new Date()
      };

      const externalMessage = adapterRegistry.fromStandard('custom', standardMessage);

      expect(externalMessage).toHaveProperty('id', '456');
      expect(externalMessage).toHaveProperty('text', 'Custom response');
      expect(externalMessage).toHaveProperty('type', 'assistant');
    });
  });

  describe('Adapter Registry', () => {
    it('should fall back to default adapter when requested adapter not found', () => {
      const externalMessage = {
        id: '789',
        role: 'user',
        content: 'Test'
      };

      const standardMessage = adapterRegistry.toStandard('non-existent', externalMessage);

      expect(standardMessage.id).toBe('789');
      expect(standardMessage.role).toBe('user');
      expect(standardMessage.content).toBe('Test');
    });
  });
});

describe('Utility Functions', () => {
  describe('deepMapObject', () => {
    it('should map object fields according to mapping', () => {
      const obj = {
        id: '123',
        text: 'Hello',
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      };

      const mapping = {
        id: 'id',
        content: 'text',
        userName: 'user.name'
      };

      const result = deepMapObject(obj, mapping);

      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('content', 'Hello');
      expect(result).toHaveProperty('userName', 'John');
    });
  });

  describe('convertTypes', () => {
    it('should convert fields to specified types', () => {
      const obj = {
        id: '123',
        active: 'true',
        count: '456',
        date: '2023-01-01'
      };

      const typeMap = {
        id: 'number',
        active: 'boolean',
        count: 'number',
        date: 'date'
      };

      const result = convertTypes(obj, typeMap);

      expect(typeof result.id).toBe('number');
      expect(typeof result.active).toBe('boolean');
      expect(typeof result.count).toBe('number');
      expect(result.date).toBeInstanceOf(Date);
    });
  });

  describe('validateRequiredFields', () => {
    it('should return missing required fields', () => {
      const obj = {
        id: '123',
        content: 'Hello'
      };

      const requiredFields = ['id', 'content', 'role'];

      const missingFields = validateRequiredFields(obj, requiredFields);

      expect(missingFields).toEqual(['role']);
    });

    it('should return empty array when all required fields are present', () => {
      const obj = {
        id: '123',
        content: 'Hello',
        role: 'user'
      };

      const requiredFields = ['id', 'content', 'role'];

      const missingFields = validateRequiredFields(obj, requiredFields);

      expect(missingFields).toEqual([]);
    });
  });
});

describe('Error Handling', () => {
  it('should throw ValidationError when required fields are missing', () => {
    const request = {
      id: '123'
    };

    const options: AdapterOptions = {
      requiredFields: ['id', 'content']
    };

    expect(() => {
      adapterRegistry.transformRequest('default', request, options);
    }).not.toThrow();
  });

  it('should handle invalid input gracefully', () => {
    const invalidInput = null;

    const result = adapterRegistry.transformRequest('default', invalidInput);

    expect(result).toBe(null);
  });
});