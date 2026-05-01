import { Injectable, Logger } from "@nestjs/common";
import { PromptService } from "@req2task/core";
import type { RenderedPrompt } from "@req2task/core";

export interface ChatContext {
  collectionId?: string;
  rawRequirementId?: string;
  title?: string;
  systemPrompt?: string;
}

export interface SendMessageDto {
  content: string;
  files?: FileContent[];
  configId?: string;
}

export interface FileContent {
  type: "text" | "docx" | "pdf" | "audio";
  data: string;
  name?: string;
}

export interface StreamChunk {
  type: "content" | "metadata" | "done" | "error";
  content?: string;
  conversationId?: string;
  messageId?: string;
  rawRequirementId?: string;
  followUpQuestions?: string[];
  keyElements?: string[];
  clarifiedContent?: string;
  isComplete?: boolean;
  error?: string;
}

export interface ChatResult {
  conversationId: string;
  messageId: string;
  content: string;
  followUpQuestions: string[];
  keyElements: string[];
  clarifiedContent?: string;
  rawRequirementId?: string;
}
/**
 * 与 RAW_REQUIREMENT_ANALYSIS 提示词参数对应
 * packages\core\src\prompts\requirement.prompts.ts
 */
export interface RequirementCollectDto {
  /*
    { name: 'projectId', type: 'string', description: '项目ID' },
      { name: 'context', type: 'string', description: '上下文信息' },
      { name: 'rawRequirement', type: 'string', required: true, description: '原始需求' },
      { name: 'projectContext', type: 'string', description: '项目背景' },
      { name: 'previousQuestions', type: 'array', description: '之前的追问问答' },
  */
  projectId: string;
  rawRequirement: string;
  projectContext?: string;
  previousQuestions?: Array<{ question: string; answer: string }>;
}

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(private readonly promptService: PromptService) {}

  /**
   * 一大段提示词分析多个原始需求 RawRequirement
   * 与 RAW_REQUIREMENT_ANALYSIS 提示词参数对应
   * packages\core\src\prompts\requirement.prompts.ts
   */
  async chatWithRequirementPromptStream(
    dto: RequirementCollectDto,
  ): Promise<RenderedPrompt> {
    const rendered = this.promptService.render("RAW_REQUIREMENT_ANALYSIS", {
      rawRequirement: dto.rawRequirement,
      projectContext: dto.projectContext || "",
      previousQuestions: dto.previousQuestions || [],
    });
    this.logger.log("分解原始需求合集为多个原始需求", rendered);
    return rendered;
  }
}
