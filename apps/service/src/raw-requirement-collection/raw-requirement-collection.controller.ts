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
import { PromptsService, RequirementCollectDto } from "../ai/PromptsService";
import { ProjectsService } from "../projects/projects.service";
import {
  CreateRawRequirementCollectionDto,
  UpdateRawRequirementCollectionDto,
  AddRawRequirementDto,
} from "@req2task/dto";
import { of, EMPTY, Observable } from "rxjs";
import { mergeMap, catchError } from "rxjs/operators";
import { ConversationClient } from "src/ai/conversation.client";

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
    private readonly promptsService: PromptsService,
    private readonly projectService: ProjectsService,
    private readonly conversationClient: ConversationClient,
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
  async analyzeRequirementStream(
    @Param("id") collectionId: string,
    @Body() body: RequirementAnalyzeBody,
    @Res() res: Response,
  ) {
    const collection = await this.collectionService.findById(collectionId);
    if (!collection) {
      res.status(404).json({ code: 1, message: "项目不存在" });
      return;
    }
    if (!collection.mainConversationId) {
      const lastConversation = await this.conversationClient.create({
        title: `Collection ${collectionId} analysis`,
      });
      collection.mainConversationId = lastConversation.id;
      this.updateCollection(collectionId, collection);
    }
    const project = await this.projectService.findById(collection.projectId);
    if (!project) {
      res.status(404).json({ code: 1, message: "项目不存在" });
      return;
    }
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
            const message =
              error instanceof Error ? error.message : "Unknown error";
            if (!res.writableEnded) {
              res.write(
                `data: ${JSON.stringify({ type: "error", error: message })}\n\n`,
              );
              res.end();
            }
          };

          const run = async () => {
            try {
              const param: RequirementCollectDto = {
                projectId: project.id,
                rawRequirement: rawRequirementText,
                projectContext: project.description || "",
                previousQuestions: body.previousQuestions,
              } as RequirementCollectDto;

              const prompts =
                await this.promptsService.chatWithRequirementPromptStream(
                  param,
                );

              res.write(
                `data: ${JSON.stringify({
                  type: "analyze_start",
                  collectionId,
                  prompts,
                  requirementFiles,
                  projectAttachments,
                })}\n\n`,
              );

              this.conversationClient.streamMessage(
                collection.mainConversationId,
                {
                  content: prompts.userPrompt,
               
                  files: [...requirementFiles, ...projectAttachments],
                },
              );

              res.write(
                `data: ${JSON.stringify({
                  type: "conversation_start",
                  conversationId: collection.mainConversationId,
                  isNewConversation: true,
                })}\n\n`,
              );

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
