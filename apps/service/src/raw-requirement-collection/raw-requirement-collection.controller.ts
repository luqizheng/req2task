import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { RawRequirementCollectionService } from "./raw-requirement-collection.service";
import { AIChatService } from "../ai/ai-chat.service";
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  AddRawRequirementDto,
} from "@req2task/dto";
import { of, EMPTY, Observable } from "rxjs";
import { mergeMap, catchError } from "rxjs/operators";

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AuthenticatedRequest {
  user: {
    userId: string;
    username: string;
  };
}

interface RequirementAnalyzeBody {
  content?: string;
  source?: string;
  audio?: string;
  attachments?: string;
  requirementFiles?: Array<{
    type: "text" | "docx" | "pdf" | "audio";
    data: string;
    name?: string;
  }>;
  projectAttachments?: Array<{
    type: "text" | "docx" | "pdf" | "audio";
    data: string;
    name?: string;
  }>;
  projectContext?: string;
  previousQuestions?: Array<{ question: string; answer: string }>;
  configId?: string;
}

@Controller("collections")
@UseGuards(AuthGuard("jwt"))
export class RawRequirementCollectionController {
  constructor(
    private readonly collectionService: RawRequirementCollectionService,
    private readonly aiChatService: AIChatService,
  ) {}

  @Post()
  async createCollection(
    @Body() dto: CreateRawRequirementCollectionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.create(dto, userId!);
    return { code: 0, data: result };
  }

  @Get()
  async getCollections(
    @Query("projectId") projectId: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findAllByProject(projectId);
    return { code: 0, data: result };
  }

  @Get(":id")
  async getCollection(@Param("id") id: string): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.findByIdWithDetails(id);
    return { code: 0, data: result };
  }

  @Put(":id")
  async updateCollection(
    @Param("id") id: string,
    @Body() dto: UpdateRawRequirementCollectionDto,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.update(id, dto);
    return { code: 0, data: result };
  }

  @Delete(":id")
  async deleteCollection(@Param("id") id: string): Promise<ApiResponse<null>> {
    await this.collectionService.delete(id);
    return { code: 0, message: "删除成功" };
  }

  @Post(":id/complete")
  async completeCollection(
    @Param("id") id: string,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.collectionService.complete(id);
    return {
      code: result.success ? 0 : 1,
      data: result,
      message: result.message,
    };
  }

  @Post(":id/raw-requirements")
  async addRawRequirement(
    @Param("id") collectionId: string,
    @Body() dto: AddRawRequirementDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as { id?: string; userId?: string };
    const userId = user.id || user.userId;
    const result = await this.collectionService.addRawRequirement(
      collectionId,
      dto.content,
      dto.source,
      userId!,
    );
    return { code: 0, data: result };
  }

  @Get(":id/raw-requirements")
  async getRawRequirements(
    @Param("id") collectionId: string,
  ): Promise<ApiResponse<unknown>> {
    const result =
      await this.collectionService.getRawRequirements(collectionId);
    return { code: 0, data: result };
  }

  @Post(":id/analyze/stream")
  analyzeRequirementStream(
    @Param("id") collectionId: string,
    @Body() body: RequirementAnalyzeBody,
    @Res() res: Response,
  ) {
    return of(null).pipe(
      mergeMap(() => {
        return new Observable((observer) => {
          const rawRequirementText = body.content || "";
          const requirementFiles = body.requirementFiles || [];
          const projectAttachments = body.projectAttachments || [];

          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.setHeader("X-Accel-Buffering", "no");

          const sendError = (error: unknown) => {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ type: "error", error: message })}\n\n`);
              res.end();
            }
          };

          const run = async () => {
            try {
              const prompts = await this.aiChatService.chatWithRequirementPromptStream({
                rawRequirement: rawRequirementText,
                projectContext: body.projectContext,
                previousQuestions: body.previousQuestions,
                configId: body.configId,
              });

              res.write(
                `data: ${JSON.stringify({
                  type: "analyze_start",
                  collectionId,
                  prompts,
                  requirementFiles,
                  projectAttachments,
                })}\n\n`,
              );

              const context = {
                collectionId,
                title: `Collection ${collectionId} analysis`,
                systemPrompt: prompts.systemPrompt,
              };

              const conversation =
                await this.aiChatService.getOrCreateConversation(context);

              res.write(
                `data: ${JSON.stringify({
                  type: "conversation_start",
                  conversationId: conversation.id,
                  isNewConversation: true,
                })}\n\n`,
              );

              const response = await fetch(
                `${process.env["AI_CHAT_SERVICE_URL"] || "http://localhost:4001"}/api/ai/conversations/${conversation.id}/messages/stream`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    content: prompts.userPrompt,
                    configId: body.configId,
                    files: [...requirementFiles, ...projectAttachments],
                  }),
                },
              );

              if (!response.ok) {
                sendError(new Error(`Request failed: ${response.status}`));
                return;
              }

              const reader = response.body?.getReader();
              if (!reader) {
                sendError(new Error("No response body"));
                return;
              }

              const decoder = new TextDecoder();
              let buffer = "";
              let isFirstEvent = true;

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
                      if (data === "[DONE]") continue;

                      if (isFirstEvent) {
                        isFirstEvent = false;
                        continue;
                      }

                      const event = JSON.parse(data);
                      if (event.type === "content" || event.type === "message" || event.type === "error") {
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
              observer.complete();
            } catch (error) {
              sendError(error);
            }
          };

          run();
        });
      }),
      catchError((error) => {
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
          );
          res.end();
        }
        return EMPTY;
      }),
    );
  }
}
