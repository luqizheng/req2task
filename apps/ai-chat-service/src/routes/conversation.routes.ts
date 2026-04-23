import { Router, Request, Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ConversationService } from "../services/conversation.service.js";
import { LLMService } from "../services/llm.service.js";
import { logger } from "../utils/logger.js";
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationListResponseDto,
  CreateConversationResponseDto,
  ConversationDto,
  SendMessageResponseDto,
  MessageListResponseDto,
} from "@req2task/dto";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

async function validateDto<T extends object>(
  dtoClass: new () => T,
  body: unknown,
): Promise<T | null> {
  const dto = plainToInstance(dtoClass, body);
  const errors = await validate(dto as object);
  if (errors.length > 0) {
    logger.debug({ errors }, 'DTO validation failed');
    return null;
  }
  return dto;
}

export function createConversationRoutes(
  conversationService: ConversationService,
  llmService: LLMService,
): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    logger.debug({ body: req.body }, 'POST /conversations - Create conversation request');

    try {
      const dto = await validateDto(CreateConversationDto, req.body);
      if (!dto) {
        logger.debug('Create conversation validation failed');
        return res
          .status(400)
          .json({ code: 1, message: "Validation failed" } as ApiResponse<null>);
      }

      logger.debug({ dto }, 'Creating conversation with validated dto');
      const conversation = await conversationService.create(dto);
      logger.info({ conversationId: conversation.id }, "Conversation created");

      return res
        .status(201)
        .json({
          code: 0,
          data: { id: conversation.id },
        } as ApiResponse<CreateConversationResponseDto>);
    } catch (error) {
      logger.error({ error }, "Create conversation error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to create conversation",
        } as ApiResponse<null>);
    }
  });

  router.post("/start", async (req: Request, res: Response) => {
    logger.debug({ body: req.body }, 'POST /conversations/start - Start new conversation');

    try {
      const body = req.body as {
        title?: string;
        systemPrompt?: string;
        content?: string;
        files?: unknown[];
      };

      logger.debug({ hasTitle: !!body.title, hasSystemPrompt: !!body.systemPrompt, hasContent: !!body.content, hasFiles: !!body.files }, 'Start conversation request params');

      const conversation = await conversationService.create({
        title: body.title,
        systemPrompt: body.systemPrompt,
      });

      logger.debug({ conversationId: conversation.id }, 'Conversation created for /start');

      if (!body.content) {
        logger.debug({ conversationId: conversation.id }, 'No content provided, returning conversation only');
        return res.status(201).json({
          code: 0,
          data: { id: conversation.id },
        } as ApiResponse<CreateConversationResponseDto>);
      }

      logger.debug({ conversationId: conversation.id }, 'Setting up SSE headers');
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      logger.debug({ conversationId: conversation.id, contentLength: body.content.length }, 'Adding user message to conversation');
      await conversationService.addMessage(conversation.id, {
        role: "user",
        content: body.content,
        metadata: null,
      });

      const messages = [
        {
          role: "system" as const,
          content: conversation.systemPrompt,
          id: "",
          createdAt: new Date(),
        },
        {
          role: "user" as const,
          content: body.content,
          id: "",
          createdAt: new Date(),
        },
      ];

      logger.debug({ conversationId: conversation.id }, 'Sending conversation_start event');
      res.write(
        `data: ${JSON.stringify({
          type: "conversation_start",
          conversationId: conversation.id,
          isNewConversation: true,
        })}\n\n`,
      );

      let fullContent = "";
      let chunkCount = 0;

      try {
        logger.debug({ conversationId: conversation.id, messageCount: messages.length }, 'Starting LLM stream');
        for await (const chunk of llmService.streamComplete(
          messages,
          undefined,
          body.files as Parameters<typeof llmService.streamComplete>[2],
        )) {
          if (chunk.content) {
            chunkCount++;
            fullContent += chunk.content;
            res.write(
              `data: ${JSON.stringify({ type: "content", content: chunk.content })}\n\n`,
            );
          }

          if (chunk.done) {
            logger.debug({ conversationId: conversation.id, totalChunks: chunkCount, fullContentLength: fullContent.length }, 'LLM stream done, saving assistant message');

            const assistantMessage = await conversationService.addMessage(
              conversation.id,
              {
                role: "assistant",
                content: fullContent,
                metadata: null,
              },
            );

            logger.debug({ messageId: assistantMessage.id, conversationId: conversation.id }, 'Assistant message saved');

            res.write(
              `data: ${JSON.stringify({
                type: "message",
                message: {
                  id: assistantMessage.id,
                  conversationId: conversation.id,
                  role: "assistant",
                  content: fullContent,
                  createdAt: assistantMessage.createdAt,
                },
              })}\n\n`,
            );
          }
        }

        logger.debug({ conversationId: conversation.id, totalChunks: chunkCount }, 'Sending done event');
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      } catch (llmError) {
        logger.error({ error: llmError, conversationId: conversation.id }, "LLM stream error");
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: llmError instanceof Error ? llmError.message : "LLM error",
          })}\n\n`,
        );
      }

      logger.debug({ conversationId: conversation.id }, 'SSE stream completed, sending [DONE]');
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      logger.error({ error }, "Start conversation error");
      if (!res.headersSent) {
        return res
          .status(500)
          .json({
            code: 1,
            message: "Failed to start conversation",
          } as ApiResponse<null>);
      }
      res.end();
    }
  });

  router.get("/", async (req: Request, res: Response) => {
    logger.debug({ query: req.query }, 'GET /conversations - List conversations');

    try {
      const limit = parseInt(req.query["limit"] as string) || 100;
      const offset = parseInt(req.query["offset"] as string) || 0;

      logger.debug({ limit, offset }, 'Fetching conversation list');
      const result = await conversationService.list(limit, offset);
      logger.debug({ total: result.total, returned: result.conversations.length }, 'Conversation list result');

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<ConversationListResponseDto>);
    } catch (error) {
      logger.error({ error }, "List conversations error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to list conversations",
        } as ApiResponse<null>);
    }
  });

  router.get("/:id", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"] }, 'GET /conversations/:id - Get conversation');

    try {
      const conversation = await conversationService.getById(req.params["id"]!);
      if (!conversation) {
        logger.debug({ conversationId: req.params["id"] }, 'Conversation not found');
        return res
          .status(404)
          .json({
            code: 1,
            message: "Conversation not found",
          } as ApiResponse<null>);
      }

      logger.debug({ conversationId: conversation.id, messageCount: conversation.messageCount }, 'Conversation found');
      return res.json({
        code: 0,
        data: conversation,
      } as ApiResponse<ConversationDto>);
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Get conversation error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to get conversation",
        } as ApiResponse<null>);
    }
  });

  router.get("/:id/messages", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"], query: req.query }, 'GET /conversations/:id/messages');

    try {
      const limit = parseInt(req.query["limit"] as string) || 100;
      const offset = parseInt(req.query["offset"] as string) || 0;

      logger.debug({ conversationId: req.params["id"], limit, offset }, 'Fetching messages');
      const result = await conversationService.getMessages(
        req.params["id"]!,
        limit,
        offset,
      );

      logger.debug({ conversationId: req.params["id"], total: result.total, returned: result.messages.length }, 'Messages fetched');

      return res.json({
        code: 0,
        data: result,
      } as ApiResponse<MessageListResponseDto>);
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Get messages error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to get messages",
        } as ApiResponse<null>);
    }
  });

  router.delete("/:id", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"] }, 'DELETE /conversations/:id');

    try {
      const deleted = await conversationService.delete(req.params["id"]!);
      if (!deleted) {
        logger.debug({ conversationId: req.params["id"] }, 'Conversation not found for delete');
        return res
          .status(404)
          .json({
            code: 1,
            message: "Conversation not found",
          } as ApiResponse<null>);
      }

      logger.info({ conversationId: req.params["id"] }, "Conversation deleted");
      return res.status(204).send();
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Delete conversation error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to delete conversation",
        } as ApiResponse<null>);
    }
  });

  router.post("/:id/archive", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"] }, 'POST /conversations/:id/archive');

    try {
      await conversationService.archive(req.params["id"]!);
      logger.info({ conversationId: req.params["id"] }, "Conversation archived");

      return res.json({
        code: 0,
        message: "Conversation archived",
      } as ApiResponse<null>);
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Archive conversation error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to archive conversation",
        } as ApiResponse<null>);
    }
  });

  router.post("/:id/messages", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"], body: req.body }, 'POST /conversations/:id/messages - Send message');

    try {
      const dto = await validateDto(SendMessageDto, req.body);
      if (!dto) {
        logger.debug({ conversationId: req.params["id"] }, 'Send message validation failed');
        return res
          .status(400)
          .json({ code: 1, message: "Validation failed" } as ApiResponse<null>);
      }

      const conversation = await conversationService.getById(req.params["id"]!);
      if (!conversation) {
        logger.debug({ conversationId: req.params["id"] }, 'Conversation not found for sending message');
        return res
          .status(404)
          .json({
            code: 1,
            message: "Conversation not found",
          } as ApiResponse<null>);
      }

      logger.debug({ conversationId: req.params["id"], contentLength: dto.content.length }, 'Adding user message');
      await conversationService.addMessage(req.params["id"]!, {
        role: "user",
        content: dto.content,
        metadata: null,
      });

      const messages = [
        {
          role: "system" as const,
          content: conversation.systemPrompt,
          id: "",
          createdAt: new Date(),
        },
        ...conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          id: m.id,
          createdAt: m.createdAt,
        })),
      ];

      logger.debug({ conversationId: req.params["id"], messageCount: messages.length }, 'Calling LLM complete');
      const response = await llmService.complete(messages, undefined, dto.files);

      logger.debug({ conversationId: req.params["id"], responseLength: response.content.length }, 'LLM response received, saving assistant message');
      const assistantMessage = await conversationService.addMessage(
        req.params["id"]!,
        {
          role: "assistant",
          content: response.content,
          metadata: null,
        },
      );

      logger.info({ conversationId: req.params["id"], messageId: assistantMessage.id }, "Message sent successfully");

      return res.json({
        code: 0,
        data: {
          message: {
            id: assistantMessage.id,
            conversationId: req.params["id"]!,
            role: "assistant",
            content: response.content,
            createdAt: assistantMessage.createdAt,
          },
        } as SendMessageResponseDto,
      } as ApiResponse<SendMessageResponseDto>);
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Send message error");
      return res
        .status(500)
        .json({
          code: 1,
          message: "Failed to send message",
        } as ApiResponse<null>);
    }
  });

  router.post("/:id/messages/stream", async (req: Request, res: Response) => {
    logger.debug({ conversationId: req.params["id"], body: req.body }, 'POST /conversations/:id/messages/stream - Stream message');

    try {
      const dto = await validateDto(SendMessageDto, req.body);
      if (!dto) {
        logger.debug({ conversationId: req.params["id"] }, 'Stream message validation failed');
        return res
          .status(400)
          .json({ code: 1, message: "Validation failed" } as ApiResponse<null>);
      }

      logger.debug({ conversationId: req.params["id"] }, 'Fetching conversation for streaming');
      const conversation = await conversationService.getById(req.params["id"]!);
      if (!conversation) {
        logger.debug({ conversationId: req.params["id"] }, 'Conversation not found for streaming');
        return res
          .status(404)
          .json({
            code: 1,
            message: "Conversation not found",
          } as ApiResponse<null>);
      }

      logger.debug({ conversationId: req.params["id"], contentLength: dto.content.length }, 'Adding user message for streaming');
      await conversationService.addMessage(req.params["id"]!, {
        role: "user",
        content: dto.content,
        metadata: null,
      });

      logger.debug({ conversationId: req.params["id"] }, 'Setting up SSE headers for streaming');
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const messages = [
        {
          role: "system" as const,
          content: conversation.systemPrompt,
          id: "",
          createdAt: new Date(),
        },
        ...conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          id: m.id,
          createdAt: m.createdAt,
        })),
      ];

      let fullContent = "";

      logger.debug({ conversationId: req.params["id"] }, 'Sending conversation_start event');
      res.write(
        `data: ${JSON.stringify({
          type: "conversation_start",
          conversationId: conversation.id,
          isNewConversation: false,
        })}\n\n`,
      );

      let chunkCount = 0;

      try {
        logger.debug({ conversationId: req.params["id"], messageCount: messages.length }, 'Starting LLM stream');
        for await (const chunk of llmService.streamComplete(
          messages,
          undefined,
          dto.files,
        )) {
          if (chunk.content) {
            chunkCount++;
            fullContent += chunk.content;
            res.write(
              `data: ${JSON.stringify({ type: "content", content: chunk.content })}\n\n`,
            );
          }

          if (chunk.done) {
            logger.debug({ conversationId: req.params["id"], totalChunks: chunkCount, fullContentLength: fullContent.length }, 'LLM stream done, saving assistant message');

            const assistantMessage = await conversationService.addMessage(
              req.params["id"]!,
              {
                role: "assistant",
                content: fullContent,
                metadata: null,
              },
            );

            logger.debug({ messageId: assistantMessage.id, conversationId: req.params["id"] }, 'Assistant message saved for streaming');

            res.write(
              `data: ${JSON.stringify({
                type: "message",
                message: {
                  id: assistantMessage.id,
                  conversationId: req.params["id"]!,
                  role: "assistant",
                  content: fullContent,
                  createdAt: assistantMessage.createdAt,
                },
              })}\n\n`,
            );
          }
        }

        logger.debug({ conversationId: req.params["id"], totalChunks: chunkCount }, 'Sending done event for streaming');
        res.write(
          `data: ${JSON.stringify({ type: "done" })}\n\n`,
        );
      } catch (llmError) {
        logger.error({ error: llmError, conversationId: req.params["id"] }, "LLM stream error in streaming endpoint");
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: llmError instanceof Error ? llmError.message : "LLM error",
          })}\n\n`,
        );
      }

      logger.debug({ conversationId: req.params["id"] }, 'SSE stream completed, sending [DONE]');
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      logger.error({ error, conversationId: req.params["id"] }, "Stream message error");
      if (!res.headersSent) {
        return res
          .status(500)
          .json({
            code: 1,
            message: "Failed to send message",
          } as ApiResponse<null>);
      }
      res.end();
    }
  });

  return router;
}
