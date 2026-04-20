import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ConversationService } from '../services/conversation.service.js';
import { LLMService } from '../services/llm.service.js';
import { logger } from '../utils/logger.js';
import type { CreateConversationRequest } from '../types.js';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

const createSchema = z.object({
  collectionId: z.string().optional(),
  rawRequirementId: z.string().optional(),
  title: z.string().optional(),
  systemPrompt: z.string().optional(),
  configId: z.string().optional(),
});

const messageSchema = z.object({
  content: z.string().min(1),
  files: z.array(z.object({
    type: z.enum(['text', 'docx', 'pdf', 'audio']),
    data: z.string(),
    name: z.string().optional(),
  })).optional(),
  configId: z.string().optional(),
});

export function createConversationRoutes(
  conversationService: ConversationService,
  llmService: LLMService
): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      const validation = createSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ code: 1, message: validation.error.message } as ApiResponse<null>);
      }

      const conversation = await conversationService.create(validation.data);
      logger.info({ conversationId: conversation.id }, 'Conversation created');
      return res.status(201).json({ code: 0, data: { id: conversation.id } } as ApiResponse<{ id: string }>);
    } catch (error) {
      logger.error({ error }, 'Create conversation error');
      return res.status(500).json({ code: 1, message: 'Failed to create conversation' } as ApiResponse<null>);
    }
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query['limit'] as string) || 100;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const conversations = await conversationService.list(limit, offset);
      return res.json({ code: 0, data: conversations } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'List conversations error');
      return res.status(500).json({ code: 1, message: 'Failed to list conversations' } as ApiResponse<null>);
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const conversation = await conversationService.getById(req.params['id']!);
      if (!conversation) {
        return res.status(404).json({ code: 1, message: 'Conversation not found' } as ApiResponse<null>);
      }
      return res.json({ code: 0, data: conversation } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Get conversation error');
      return res.status(500).json({ code: 1, message: 'Failed to get conversation' } as ApiResponse<null>);
    }
  });

  router.get('/:id/messages', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query['limit'] as string) || 100;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const messages = await conversationService.getMessages(req.params['id']!, limit, offset);
      return res.json({ code: 0, data: messages } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Get messages error');
      return res.status(500).json({ code: 1, message: 'Failed to get messages' } as ApiResponse<null>);
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const deleted = await conversationService.delete(req.params['id']!);
      if (!deleted) {
        return res.status(404).json({ code: 1, message: 'Conversation not found' } as ApiResponse<null>);
      }
      logger.info({ conversationId: req.params['id'] }, 'Conversation deleted');
      return res.status(204).send();
    } catch (error) {
      logger.error({ error }, 'Delete conversation error');
      return res.status(500).json({ code: 1, message: 'Failed to delete conversation' } as ApiResponse<null>);
    }
  });

  router.post('/:id/archive', async (req: Request, res: Response) => {
    try {
      await conversationService.archive(req.params['id']!);
      logger.info({ conversationId: req.params['id'] }, 'Conversation archived');
      return res.json({ code: 0, message: 'Conversation archived' } as ApiResponse<null>);
    } catch (error) {
      logger.error({ error }, 'Archive conversation error');
      return res.status(500).json({ code: 1, message: 'Failed to archive conversation' } as ApiResponse<null>);
    }
  });

  router.post('/:id/link/:nextId', async (req: Request, res: Response) => {
    try {
      await conversationService.linkToNext(req.params['id']!, req.params['nextId']!);
      logger.info({
        currentId: req.params['id'],
        nextId: req.params['nextId'],
      }, 'Conversations linked');
      return res.json({ code: 0, message: 'Conversations linked' } as ApiResponse<null>);
    } catch (error) {
      logger.error({ error }, 'Link conversations error');
      return res.status(500).json({ code: 1, message: 'Failed to link conversations' } as ApiResponse<null>);
    }
  });

  router.post('/:id/messages', async (req: Request, res: Response) => {
    try {
      const validation = messageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ code: 1, message: validation.error.message } as ApiResponse<null>);
      }

      const conversation = await conversationService.getById(req.params['id']!);
      if (!conversation) {
        return res.status(404).json({ code: 1, message: 'Conversation not found' } as ApiResponse<null>);
      }

      const { content, files } = validation.data;

      await conversationService.addMessage(req.params['id']!, {
        role: 'user',
        content,
        metadata: null,
      });

      const messages = [
        { role: 'system' as const, content: conversation.systemPrompt, id: '', createdAt: new Date() },
        ...conversation.messages.map(m => ({ role: m.role, content: m.content, id: m.id, createdAt: m.createdAt })),
      ];

      const response = await llmService.complete(messages, undefined, files);

      const assistantMessage = await conversationService.addMessage(req.params['id']!, {
        role: 'assistant',
        content: response.content,
        metadata: null,
      });

      const followUpQuestions = llmService.extractFollowUpQuestions(response.content);
      const keyElements = llmService.extractKeyElements(response.content);

      await conversationService.updateMetadata(req.params['id']!, {
        followUpQuestions,
        keyElements,
      });

      logger.info({ conversationId: req.params['id'] }, 'Message sent');

      return res.json({
        code: 0,
        data: {
          message: {
            id: assistantMessage.id,
            role: 'assistant',
            content: response.content,
            createdAt: assistantMessage.createdAt,
          },
          metadata: { followUpQuestions, keyElements },
        },
      } as ApiResponse<unknown>);
    } catch (error) {
      logger.error({ error }, 'Send message error');
      return res.status(500).json({ code: 1, message: 'Failed to send message' } as ApiResponse<null>);
    }
  });

  router.post('/:id/messages/stream', async (req: Request, res: Response) => {
    try {
      const validation = messageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ code: 1, message: validation.error.message } as ApiResponse<null>);
      }

      const conversation = await conversationService.getById(req.params['id']!);
      if (!conversation) {
        return res.status(404).json({ code: 1, message: 'Conversation not found' } as ApiResponse<null>);
      }

      const { content, files } = validation.data;

      await conversationService.addMessage(req.params['id']!, {
        role: 'user',
        content,
        metadata: null,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const messages = [
        { role: 'system' as const, content: conversation.systemPrompt, id: '', createdAt: new Date() },
        ...conversation.messages.map(m => ({ role: m.role, content: m.content, id: m.id, createdAt: m.createdAt })),
      ];

      let fullContent = '';

      res.write(`data: ${JSON.stringify({ type: 'metadata', conversationId: conversation.id })}\n\n`);

      try {
        for await (const chunk of llmService.streamComplete(messages, undefined, files)) {
          if (chunk.content) {
            fullContent += chunk.content;
            res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`);
          }

          if (chunk.done) {
            const assistantMessage = await conversationService.addMessage(req.params['id']!, {
              role: 'assistant',
              content: fullContent,
              metadata: null,
            });

            res.write(`data: ${JSON.stringify({
              type: 'metadata',
              messageId: assistantMessage.id,
              isComplete: true,
            })}\n\n`);
          }
        }

        const followUpQuestions = llmService.extractFollowUpQuestions(fullContent);
        const keyElements = llmService.extractKeyElements(fullContent);

        await conversationService.updateMetadata(req.params['id']!, {
          followUpQuestions,
          keyElements,
        });

        res.write(`data: ${JSON.stringify({
          type: 'done',
          followUpQuestions,
          keyElements,
        })}\n\n`);

      } catch (llmError) {
        logger.error({ error: llmError }, 'LLM stream error');
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: llmError instanceof Error ? llmError.message : 'LLM error',
        })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error({ error }, 'Stream message error');
      if (!res.headersSent) {
        return res.status(500).json({ code: 1, message: 'Failed to send message' } as ApiResponse<null>);
      }
      res.end();
    }
  });

  return router;
}
