import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Requirement,
  RawRequirement,
  ChromaVectorStore,
  VectorDocument,
} from "@req2task/core";

export interface RequirementVectorMeta {
  projectId: string;
  moduleId?: string;
  type: "requirement" | "raw_requirement";
}

@Injectable()
export class RequirementVectorService implements OnModuleInit {
  constructor(
    private vectorStore: ChromaVectorStore,
    @InjectRepository(Requirement)
    private requirementRepo: Repository<Requirement>,
    @InjectRepository(RawRequirement)
    private rawRequirementRepo: Repository<RawRequirement>,
  ) {}

  async onModuleInit() {
    if (!this.vectorStore.isConnected()) {
      console.warn(
        "Vector store not connected. RequirementVectorService may not work properly.",
      );
    }
  }

  async getCollectionInfo() {
    return this.vectorStore.getCollectionInfo();
  }

  async indexRequirement(requirement: Requirement): Promise<void> {
    const content = this.buildRequirementContent(requirement);
    const metadata: RequirementVectorMeta = {
      projectId: requirement.projectId,
      moduleId: requirement.moduleId || undefined,
      type: "requirement",
    };

    const document: VectorDocument = {
      id: `requirement:${requirement.id}`,
      content,
      metadata: metadata as unknown as Record<string, unknown>,
    };

    await this.vectorStore.add([document]);
  }

  async indexRawRequirement(rawRequirement: RawRequirement): Promise<void> {
    const content =
      rawRequirement.clarifiedContent || rawRequirement.originalContent;
    const metadata: RequirementVectorMeta = {
      projectId: rawRequirement.projectId,
      type: "raw_requirement",
    };

    const document: VectorDocument = {
      id: `raw_requirement:${rawRequirement.id}`,
      content,
      metadata: metadata as unknown as Record<string, unknown>,
    };

    await this.vectorStore.add([document]);
  }

  async removeRequirement(requirementId: string): Promise<void> {
    await this.vectorStore.delete([`requirement:${requirementId}`]);
  }

  async removeRawRequirement(rawRequirementId: string): Promise<void> {
    await this.vectorStore.delete([`raw_requirement:${rawRequirementId}`]);
  }

  async searchSimilarRequirements(
    query: string,
    projectId: string,
    limit: number = 5,
  ): Promise<
    Array<{ id: string; content: string; score: number; type: string }>
  > {
    console.warn("searchSimilarRequirements - 查询参数:", { query, projectId, limit });
    const results = await this.vectorStore.searchWithFilter(
      query,
      { projectId },
      limit,
    );
    console.warn("searchSimilarRequirements - ChromaDB 返回结果:", {
      count: results.length,
      first3: results.slice(0, 3).map(r => ({ id: r.id, score: r.score, content: r.content.substring(0, 50) }))
    });
    return results.map((r) => ({
      id: r.id.replace(/^(requirement|raw_requirement):/, ""),
      content: r.content,
      score: r.score,
      type: r.id.startsWith("requirement:") ? "requirement" : "raw_requirement",
    }));
  }

  async rebuildAll(
    projectId?: string,
    clean?: boolean,
  ): Promise<{ requirements: number; rawRequirements: number }> {
    if (clean) {
      await this.vectorStore.recreateCollection();
    }

    let requirementQuery = this.requirementRepo.createQueryBuilder("r");
    let rawRequirementQuery = this.rawRequirementRepo.createQueryBuilder("rr");

    if (projectId) {
      requirementQuery = requirementQuery.where("r.projectId = :projectId", {
        projectId,
      });
      rawRequirementQuery = rawRequirementQuery.where(
        "rr.projectId = :projectId",
        { projectId },
      );
    }

    const requirements = await requirementQuery.getMany();
    const rawRequirements = await rawRequirementQuery.getMany();

    if (!clean) {
      if (projectId) {
        await this.vectorStore.deleteByFilter({ projectId });
      } else {
        const count = await this.vectorStore.getCount();
        if (count > 0) {
          console.warn("Clearing all vector store entries for full rebuild");
        }
      }
    }

    const documents: VectorDocument[] = [];

    for (const req of requirements) {
      documents.push({
        id: `requirement:${req.id}`,
        content: this.buildRequirementContent(req),
        metadata: {
          projectId: req.projectId,
          moduleId: req.moduleId || undefined,
          type: "requirement",
        } as Record<string, unknown>,
      });
    }

    for (const rr of rawRequirements) {
      const content = rr.clarifiedContent || rr.originalContent;
      documents.push({
        id: `raw_requirement:${rr.id}`,
        content,
        metadata: {
          projectId: rr.projectId,
          type: "raw_requirement",
        } as Record<string, unknown>,
      });
    }

    if (documents.length > 0) {
      await this.vectorStore.add(documents);
    }

    return {
      requirements: requirements.length,
      rawRequirements: rawRequirements.length,
    };
  }

  private buildRequirementContent(requirement: Requirement): string {
    const parts: string[] = [requirement.title, requirement.description];

    if (requirement.keyElements && requirement.keyElements.length > 0) {
      parts.push(`关键要素: ${requirement.keyElements.join(", ")}`);
    }

    const result= parts.join("\n");
    console.log('需求向量内容', result);
    return result;
  }

  async checkRequirements(
    projectId: string,
    requirements: Array<{ id: string; title: string; description: string }>,
  ): Promise<
    Array<{
      requirementId: string;
      hasDuplicate: boolean;
      duplicateRequirements: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
      }>;
      hasConflict: boolean;
      conflictDescription?: string;
      conflictRequirements: Array<{
        id: string;
        title: string;
        description: string;
        score: number;
      }>;
    }>
  > {
    const results = [];
    const SIMILARITY_THRESHOLD = 0.65;
    const DUPLICATE_THRESHOLD = 0.85;

    for (const req of requirements) {
      const query = `${req.title} ${req.description}`;
      console.log("checkRequirements - 处理需求:", { reqId: req.id, reqTitle: req.title });
      console.log("checkRequirements - 查询内容:", query);
      
      const similarResults = await this.searchSimilarRequirements(
        query,
        projectId,
        5,
      );

      console.log("checkRequirements - 相似结果:", {
        count: similarResults.length,
        items: similarResults.map(r => ({ id: r.id, score: r.score })),
        DUPLICATE_THRESHOLD,
        SIMILARITY_THRESHOLD,
      });

      const duplicates = similarResults
        .filter((r) => r.score >= DUPLICATE_THRESHOLD && r.id !== req.id)
        .map((r) => ({
          id: r.id,
          title: this.extractTitle(r.content),
          description: r.content,
          score: r.score,
        }));

      console.log("checkRequirements - 过滤后duplicates:", {
        count: duplicates.length,
        items: duplicates,
      });

      const potentialConflicts = similarResults.filter(
        (r) =>
          r.score >= SIMILARITY_THRESHOLD &&
          r.score < DUPLICATE_THRESHOLD &&
          r.id !== req.id,
      );

      let hasConflict = false;
      let conflictDescription: string | undefined;

      if (potentialConflicts.length > 0) {
        const conflictKeywords = [
          "不能",
          "禁止",
          "应该不",
          "不允",
          "必须不",
          "不是",
          "不等于",
        ];
        const hasConflictKeyword = conflictKeywords.some(
          (keyword) =>
            req.description.includes(keyword) ||
            potentialConflicts.some((c) => c.content.includes(keyword)),
        );

        if (hasConflictKeyword) {
          hasConflict = true;
          conflictDescription = "与现有需求存在语义冲突，可能存在逻辑矛盾";
        }
      }

      results.push({
        requirementId: req.id,
        hasDuplicate: duplicates.length > 0,
        duplicateRequirements: duplicates,
        hasConflict,
        conflictDescription,
        conflictRequirements: potentialConflicts.map((r) => ({
          id: r.id,
          title: this.extractTitle(r.content),
          description: r.content,
          score: r.score,
        })),
      });
    }

    return results;
  }

  private extractTitle(content: string): string {
    const lines = content.split("\n");
    return lines[0] || content.substring(0, 50);
  }
}
