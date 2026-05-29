import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ChainService } from '../services/chain.service.js';
import { ToolRegistry } from '../services/tool-registry.service.js';
import { PromptTemplateService } from '../services/prompt-template.service.js';
import { logger } from '../utils/logger.js';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export function createLangChainRoutes(
  chainService: ChainService,
  toolRegistry: ToolRegistry,
  promptTemplateService: PromptTemplateService,
): Router {
  const router = Router();

  router.get('/tools', (_req: Request, res: Response) => {
    try {
      const tools = toolRegistry.getToolDefinitions();
      logger.debug({ toolCount: tools.length }, 'Listing tools');

      return res.json({
        code: 0,
        data: tools,
      } as ApiResponse<typeof tools>);
    } catch (error) {
      logger.error({ error }, 'Failed to list tools');
      return res.status(500).json({
        code: 1,
        message: 'Failed to list tools',
      } as ApiResponse<null>);
    }
  });

  router.post('/tools/execute', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        toolName: z.string(),
        args: z.record(z.string(), z.any()),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid tool execution request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { toolName, args } = validation.data;
      const tool = toolRegistry.getTool(toolName);

      if (!tool) {
        logger.warn({ toolName }, 'Tool not found');
        return res.status(404).json({
          code: 1,
          message: `Tool ${toolName} not found`,
        } as ApiResponse<null>);
      }

      logger.debug({ toolName, args }, 'Executing tool');
      const result = await tool.func(args);

      return res.json({
        code: 0,
        data: {
          toolName,
          result,
        },
      } as ApiResponse<{ toolName: string; result: unknown }>);
    } catch (error) {
      logger.error({ error }, 'Tool execution error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to execute tool',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/llm', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        prompt: z.string(),
        inputVariables: z.record(z.string(), z.string()),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid LLM chain request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { prompt, inputVariables, config } = validation.data;
      logger.debug({ promptLength: prompt.length, inputVariables: Object.keys(inputVariables) }, 'Running LLM chain');

      const result = await chainService.runLLMChain(prompt, inputVariables, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'LLM chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run LLM chain',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/sequential', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        steps: z.array(
          z.object({
            prompt: z.string(),
            inputVariables: z.array(z.string()),
            outputKey: z.string(),
          }),
        ),
        initialInputs: z.record(z.string(), z.string()),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid sequential chain request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { steps, initialInputs, config } = validation.data;
      logger.debug({ stepCount: steps.length }, 'Running sequential chain');

      const result = await chainService.runSequentialChain(steps, initialInputs, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'Sequential chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run sequential chain',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/conversation', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
          }),
        ),
        systemPrompt: z.string().optional(),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid conversation chain request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { messages, systemPrompt, config } = validation.data;
      logger.debug({ messageCount: messages.length }, 'Running conversation chain');

      const result = await chainService.runConversationChain(messages, systemPrompt, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'Conversation chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run conversation chain',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/summarize', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string(),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid summarization request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { text, config } = validation.data;
      logger.debug({ textLength: text.length }, 'Running summarization chain');

      const result = await chainService.runSummarizationChain(text, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'Summarization chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run summarization chain',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/translate', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string(),
        targetLanguage: z.string().default('English'),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid translation request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { text, targetLanguage, config } = validation.data;
      logger.debug({ textLength: text.length, targetLanguage }, 'Running translation chain');

      const result = await chainService.runTranslationChain(text, targetLanguage, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'Translation chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run translation chain',
      } as ApiResponse<null>);
    }
  });

  router.post('/chain/extract', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        text: z.string(),
        schema: z.record(z.string(), z.string()),
        config: z
          .object({
            modelName: z.string().optional(),
            provider: z.string().optional(),
            temperature: z.number().optional(),
            maxTokens: z.number().optional(),
          })
          .optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid extraction request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { text, schema: extractionSchema, config } = validation.data;
      logger.debug({ textLength: text.length, fields: Object.keys(extractionSchema) }, 'Running extraction chain');

      const result = await chainService.runExtractionChain(text, extractionSchema, config);

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<typeof result>);
    } catch (error) {
      logger.error({ error }, 'Extraction chain error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to run extraction chain',
      } as ApiResponse<null>);
    }
  });

  router.get('/prompts', (_req: Request, res: Response) => {
    try {
      const templates = promptTemplateService.getAllTemplates();
      logger.debug({ templateCount: templates.length }, 'Listing prompt templates');

      return res.json({
        code: 0,
        data: templates,
      } as ApiResponse<typeof templates>);
    } catch (error) {
      logger.error({ error }, 'Failed to list prompt templates');
      return res.status(500).json({
        code: 1,
        message: 'Failed to list prompt templates',
      } as ApiResponse<null>);
    }
  });

  router.get('/prompts/:id', (req: Request, res: Response) => {
    try {
      const template = promptTemplateService.getTemplate(req.params.id);
      if (!template) {
        logger.warn({ templateId: req.params.id }, 'Prompt template not found');
        return res.status(404).json({
          code: 1,
          message: 'Prompt template not found',
        } as ApiResponse<null>);
      }

      return res.json({
        code: 0,
        data: template,
      } as ApiResponse<typeof template>);
    } catch (error) {
      logger.error({ error }, 'Failed to get prompt template');
      return res.status(500).json({
        code: 1,
        message: 'Failed to get prompt template',
      } as ApiResponse<null>);
    }
  });

  router.post('/prompts/format', async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        templateId: z.string(),
        variables: z.record(z.string(), z.string()),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid format request');
        return res.status(400).json({
          code: 1,
          message: validation.error.message,
        } as ApiResponse<null>);
      }

      const { templateId, variables } = validation.data;
      const formatted = await promptTemplateService.formatTemplate(templateId, variables);

      if (!formatted) {
        logger.warn({ templateId }, 'Failed to format template');
        return res.status(404).json({
          code: 1,
          message: 'Failed to format template',
        } as ApiResponse<null>);
      }

      return res.json({
        code: 0,
        data: {
          formatted,
        },
      } as ApiResponse<{ formatted: string }>);
    } catch (error) {
      logger.error({ error }, 'Failed to format template');
      return res.status(500).json({
        code: 1,
        message: 'Failed to format template',
      } as ApiResponse<null>);
    }
  });

  return router;
}