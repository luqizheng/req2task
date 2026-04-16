import { CriteriaType } from '@req2task/core';

export class AcceptanceCriteriaSummaryDto {
  id!: string;
  criteriaType!: CriteriaType;
  content!: string;
}
