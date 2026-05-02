import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, RawRequirement, ChromaVectorStore, VectorDocument } from '@req2task/core';

export interface RequirementVectorMeta {
  projectId: string;
  moduleId?: string;
  type: 'requirement' | 'raw_requirement';
}

@Injectable()
export class RequirementVectorService implements OnModuleInit {
  constructor(
    private vectorStore: ChromaVectorStore,
    @InjectRepository(Requirement) private requirementRepo: Repository<Requirement>,
    @InjectRepository(RawRequirement) private rawRequirementRepo: Repository<RawRequirement>,
  ) {}

  async onModuleInit() {
    if (!this.vectorStore.isConnected()) {
      console.warn('Vector store not connected. RequirementVectorService may not work properly.');
    }
  }

  async indexRequirement(requirement: Requirement): Promise<void> {
    const content = this.buildRequirementContent(requirement);
    const metadata: RequirementVectorMeta = {
      projectId: requirement.projectId,
      moduleId: requirement.moduleId || undefined,
      type: 'requirement',
    };

    const document: VectorDocument = {
      id: `requirement:${requirement.id}`,
      content,
      metadata,
    };

    await this.vectorStore.add([document]);
  }

  async indexRawRequirement(rawRequirement: RawRequirement): Promise<void> {
    const content = rawRequirement.clarifiedContent || rawRequirement.originalContent;
    const metadata: RequirementVectorMeta = {
      projectId: rawRequirement.projectId,
      type: 'raw_requirement',
    };

    const document: VectorDocument = {
      id: `raw_requirement:${rawRequirement.id}`,
      content,
      metadata,
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
  ): Promise<Array<{ id: string; content: string; score: number; type: string }>> {
    const results = await this.vectorStore.searchWithFilter(query, { projectId }, limit);

    return results.map((r) => ({
      id: r.id.replace(/^(requirement|raw_requirement):/, ''),
      content: r.content,
      score: r.score,
      type: r.id.startsWith('requirement:') ? 'requirement' : 'raw_requirement',
    }));
  }

  async rebuildAll(projectId?: string): Promise<{ requirements: number; rawRequirements: number }> {
    let requirementQuery = this.requirementRepo.createQueryBuilder('r');
    let rawRequirementQuery = this.rawRequirementRepo.createQueryBuilder('rr');

    if (projectId) {
      requirementQuery = requirementQuery.where('r.projectId = :projectId', { projectId });
      rawRequirementQuery = rawRequirementQuery.where('rr.projectId = :projectId', { projectId });
    }

    const requirements = await requirementQuery.getMany();
    const rawRequirements = await rawRequirementQuery.getMany();

    if (projectId) {
      await this.vectorStore.deleteByFilter({ projectId });
    } else {
      const count = await this.vectorStore.getCount();
      if (count > 0) {
        console.warn('Clearing all vector store entries for full rebuild');
      }
    }

    const documents: VectorDocument[] = [];

    for (const req of requirements) {
      documents.push({
        id: `requirement:${req.id}`,
        content: this.buildRequirementContent(req),
        metadata: { projectId: req.projectId, moduleId: req.moduleId || undefined, type: 'requirement' },
      });
    }

    for (const rr of rawRequirements) {
      const content = rr.clarifiedContent || rr.originalContent;
      documents.push({
        id: `raw_requirement:${rr.id}`,
        content,
        metadata: { projectId: rr.projectId, type: 'raw_requirement' },
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
    const parts: string[] = [
      requirement.title,
      requirement.content,
    ];

    if (requirement.keyElements && requirement.keyElements.length > 0) {
      parts.push(`关键要素: ${requirement.keyElements.join(', ')}`);
    }

    return parts.join('\n');
  }
}
