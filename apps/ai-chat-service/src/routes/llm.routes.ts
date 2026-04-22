import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LLMService } from '../services/llm.service.js';
import { logger } from '../utils/logger.js';

const generateStreamSchema = z.object({
  systemPrompt: z.string().min(1),
  userPrompt: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(8000).default(2000),
  conversationId: z.string().optional(),
});

export function createLlmRoutes(llmService: LLMService): Router {
  const router = Router();

  router.post('/generate/stream', async (req: Request, res: Response) => {
    try {
      const validation = generateStreamSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid request body');
        return res.status(400).json({
          code: 1,
          message: 'Validation failed: ' + validation.error.message,
        });
      }

      const { systemPrompt, userPrompt, temperature, maxTokens, conversationId } = validation.data;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
          id: '',
          createdAt: new Date(),
        },
        {
          role: 'user' as const,
          content: userPrompt,
          id: '',
          createdAt: new Date(),
        },
      ];

      let fullContent = '';

      res.write(
        `data: ${JSON.stringify({ type: 'metadata', conversationId: conversationId || '' })}\n\n`,
      );

      try {
        for await (const chunk of llmService.streamComplete(messages)) {
          if (chunk.content) {
            fullContent += chunk.content;
            res.write(
              `data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`,
            );
          }

          if (chunk.done) {
            res.write(
              `data: ${JSON.stringify({
                type: 'message',
                message: {
                  id: `generated_${Date.now()}`,
                  conversationId: conversationId || '',
                  role: 'assistant',
                  content: fullContent,
                  createdAt: new Date().toISOString(),
                },
              })}\n\n`,
            );
          }
        }

        const followUpQuestions = llmService.extractFollowUpQuestions(fullContent);
        const keyElements = llmService.extractKeyElements(fullContent);

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            followUpQuestions,
            keyElements,
          })}\n\n`,
        );

        logger.info(
          {
            conversationId,
            contentLength: fullContent.length,
            followUpQuestionsCount: followUpQuestions.length,
            keyElementsCount: keyElements.length,
          },
          'LLM generation completed',
        );
      } catch (llmError) {
        logger.error({ error: llmError }, 'LLM stream error');
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: llmError instanceof Error ? llmError.message : 'LLM error',
          })}\n\n`,
        );
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error({ error }, 'Generate stream error');
      if (!res.headersSent) {
        return res.status(500).json({
          code: 1,
          message: 'Failed to generate content',
        });
      }
      res.end();
    }
  });

  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const validation = generateStreamSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn({ error: validation.error }, 'Invalid request body');
        return res.status(400).json({
          code: 1,
          message: 'Validation failed: ' + validation.error.message,
        });
      }

      const { systemPrompt, userPrompt, temperature, maxTokens, conversationId } = validation.data;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
          id: '',
          createdAt: new Date(),
        },
        {
          role: 'user' as const,
          content: userPrompt,
          id: '',
          createdAt: new Date(),
        },
      ];

      const response = await llmService.complete(messages);

      const followUpQuestions = llmService.extractFollowUpQuestions(response.content);
      const keyElements = llmService.extractKeyElements(response.content);

      logger.info(
        {
          conversationId,
          contentLength: response.content.length,
        },
        'LLM generation completed (non-stream)',
      );

      return res.json({
        code: 0,
        data: {
          content: response.content,
          conversationId: conversationId || '',
          followUpQuestions,
          keyElements,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Generate error');
      return res.status(500).json({
        code: 1,
        message: 'Failed to generate content',
      });
    }
  });

  return router;
}
