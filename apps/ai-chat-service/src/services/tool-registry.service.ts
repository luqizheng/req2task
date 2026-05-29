import { z } from 'zod';
import { logger } from '../utils/logger.js';

export interface ToolInfo {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  func: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface RegisteredTool {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  func: (args: Record<string, unknown>) => Promise<unknown>;
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  registerTool(tool: ToolInfo): void {
    this.tools.set(tool.name, {
      name: tool.name,
      description: tool.description,
      schema: tool.schema,
      func: tool.func,
    });
    logger.info({ toolName: tool.name }, 'Tool registered');
  }

  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): ToolDefinition[] {
    return this.getAllTools().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.zodSchemaToJsonSchema(tool.schema),
      },
    }));
  }

  private zodSchemaToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): Record<string, unknown> {
    const result: Record<string, unknown> = {
      type: 'object',
      properties: {},
      required: [],
    };

    const shape = schema.shape;
    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema: Record<string, unknown> = {};
      
      if (value instanceof z.ZodString) {
        fieldSchema.type = 'string';
      } else if (value instanceof z.ZodNumber) {
        fieldSchema.type = 'number';
      } else if (value instanceof z.ZodBoolean) {
        fieldSchema.type = 'boolean';
      } else if (value instanceof z.ZodArray) {
        fieldSchema.type = 'array';
      } else if (value instanceof z.ZodObject) {
        fieldSchema.type = 'object';
      } else {
        fieldSchema.type = 'string';
      }

      if (value.description) {
        fieldSchema.description = value.description;
      }

      if (!value.isOptional()) {
        (result.required as string[]).push(key);
      }

      (result.properties as Record<string, unknown>)[key] = fieldSchema;
    }

    return result;
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  unregisterTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      logger.info({ toolName: name }, 'Tool unregistered');
    }
    return removed;
  }

  clearAll(): void {
    this.tools.clear();
    logger.info('All tools cleared');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    logger.debug({ toolName: name, args }, 'Calling tool');
    return tool.func(args);
  }
}

export const defaultTools: ToolInfo[] = [
  {
    name: 'get_weather',
    description: '获取指定城市的天气信息',
    schema: z.object({
      city: z.string().describe('城市名称，如：北京、上海'),
    }),
    func: async (args) => {
      const city = args.city as string;
      logger.debug({ city }, 'Getting weather for city');
      return `城市 ${city} 的天气信息：晴，温度 25°C，湿度 60%`;
    },
  },
  {
    name: 'search_web',
    description: '在网络上搜索信息',
    schema: z.object({
      query: z.string().describe('搜索查询词'),
    }),
    func: async (args) => {
      const query = args.query as string;
      logger.debug({ query }, 'Performing web search');
      return `搜索结果：关于 "${query}" 的相关信息...（模拟搜索结果）`;
    },
  },
  {
    name: 'calculate',
    description: '执行数学计算',
    schema: z.object({
      expression: z.string().describe('数学表达式，如：2 + 3 * 4'),
    }),
    func: async (args) => {
      const expression = args.expression as string;
      logger.debug({ expression }, 'Calculating expression');
      try {
        const result = new Function(`return ${expression}`)();
        return `计算结果：${expression} = ${result}`;
      } catch {
        return `无法计算表达式：${expression}`;
      }
    },
  },
  {
    name: 'get_current_time',
    description: '获取当前时间',
    schema: z.object({}),
    func: async () => {
      const now = new Date();
      return `当前时间：${now.toLocaleString('zh-CN')}`;
    },
  },
];

export function registerDefaultTools(registry: ToolRegistry): void {
  defaultTools.forEach((tool) => {
    registry.registerTool(tool);
  });
  logger.info({ count: defaultTools.length }, 'Default tools registered');
}