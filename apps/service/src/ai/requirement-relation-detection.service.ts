import { Injectable, Logger } from '@nestjs/common';
import { RequirementVectorService } from './requirement-vector.service';

export interface RelatedRequirement {
  id: string;
  entityKey: string;
  title: string;
  content: string;
  score: number;
  relationType: 'similar' | 'conflict' | 'extends' | 'depends';
}

export interface RelationDetectionResult {
  hasRelated: boolean;
  relatedRequirements: RelatedRequirement[];
  conflictRequirements: RelatedRequirement[];
}

@Injectable()
export class RequirementRelationDetectionService {
  private readonly logger = new Logger(RequirementRelationDetectionService.name);
  private readonly SIMILARITY_THRESHOLD = 0.6;
  private readonly CONFLICT_KEYWORDS = [
    '不能', '禁止', '不应该', '不允', '必须不',
    '不是', '不等于', '不同于', '不要', '拒绝',
  ];

  constructor(private readonly vectorService: RequirementVectorService) {}

  async detectRelations(
    newContent: string,
    projectId: string,
    limit: number = 5,
  ): Promise<RelationDetectionResult> {
    try {
      const similarRequirements = await this.vectorService.searchSimilarRequirements(
        newContent,
        projectId,
        limit,
      );

      const relatedRequirements: RelatedRequirement[] = [];
      const conflictRequirements: RelatedRequirement[] = [];

      for (const req of similarRequirements) {
        if (req.score < this.SIMILARITY_THRESHOLD) {
          continue;
        }

        const hasConflict = this.detectConflict(newContent, req.content);
        const relationType = hasConflict ? 'conflict' : 'similar';

        const related: RelatedRequirement = {
          id: req.id,
          entityKey: '',
          title: '',
          content: req.content,
          score: req.score,
          relationType,
        };

        if (hasConflict) {
          conflictRequirements.push(related);
        } else {
          relatedRequirements.push(related);
        }
      }

      return {
        hasRelated: relatedRequirements.length > 0 || conflictRequirements.length > 0,
        relatedRequirements,
        conflictRequirements,
      };
    } catch (error) {
      this.logger.error(`Failed to detect relations: ${error}`);
      return {
        hasRelated: false,
        relatedRequirements: [],
        conflictRequirements: [],
      };
    }
  }

  private detectConflict(content1: string, content2: string): boolean {
    const content = `${content1} ${content2}`.toLowerCase();
    let conflictScore = 0;

    for (const keyword of this.CONFLICT_KEYWORDS) {
      if (content.includes(keyword)) {
        conflictScore++;
      }
    }

    return conflictScore >= 2;
  }

  async getRelatedRequirementDetails(
    _relatedIds: string[],
  ): Promise<Map<string, { entityKey: string; title: string }>> {
    const details = new Map<string, { entityKey: string; title: string }>();
    return details;
  }
}
