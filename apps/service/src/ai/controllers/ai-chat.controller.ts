import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { AIChatService } from "../ai-chat.service";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface CreateConversationBody {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

interface SendMessageBody {
  content: string;
  files?: Array<{
    type: "text" | "docx" | "pdf" | "audio";
    data: string;
    name?: string;
  }>;
  configId?: string;
}

interface StreamQuery {
  content: string;
  files?: string;
  configId?: string;
}

@Controller("ai/chat")
@UseGuards(AuthGuard("jwt"))
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @Post("conversations")
  async createConversation(
    @Body() body: CreateConversationBody,
  ): Promise<ApiResponse<{ id: string }>> {
    const conversation = await this.aiChatService.createConversation({
      collectionId: body.collectionId,
      rawRequirementId: body.rawRequirementId,
      title: body.title,
      systemPrompt: body.systemPrompt,
    });
    return { code: 0, data: conversation };
  }

  @Get("conversations/:id")
  async getConversation(
    @Param("id") id: string,
  ): Promise<ApiResponse<unknown>> {
    const conversation = await this.aiChatService.getConversation(id);
    return { code: 0, data: conversation };
  }

  @Get("conversations/:id/messages")
  async getMessages(
    @Param("id") id: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.aiChatService.getMessages(
      id,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
    return { code: 0, data: result };
  }

  @Post("conversations/:id/messages")
  async sendMessage(
    @Param("id") conversationId: string,
    @Body() body: SendMessageBody,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.aiChatService.sendMessage(conversationId, {
      content: body.content,
      files: body.files,
      configId: body.configId,
    });
    return { code: 0, data: result };
  }

  @Post("conversations/:id/stream")
  streamMessage(
    @Param("id") conversationId: string,
    @Query() query: StreamQuery,
    @Res() res: Response,
  ) {
    const files = query.files ? JSON.parse(query.files) : undefined;

    return of(null).pipe(
      map(async () => {
        const streamUrl = this.aiChatService.getStreamUrl(conversationId, {
          content: query.content,
          files,
          configId: query.configId,
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

        try {
          const response = await fetch(streamUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ files, configId: query.configId }),
          });

          if (!response.ok) {
            res.write(
              `data: ${JSON.stringify({ type: "error", error: `Request failed: ${response.status}` })}\n\n`,
            );
            res.end();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            res.write(
              `data: ${JSON.stringify({ type: "error", error: "No response body" })}\n\n`,
            );
            res.end();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data !== "[DONE]") {
                    res.write(`${line}\n`);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          res.end();
        } catch (error) {
          res.write(
            `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
          );
          res.end();
        }
      }),
      catchError((error) => {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`,
        );
        res.end();
        return of(null);
      }),
    );
  }

  @Delete("conversations/:id")
  async deleteConversation(
    @Param("id") id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    return { code: 0, data: { deleted: true } };
  }
}
