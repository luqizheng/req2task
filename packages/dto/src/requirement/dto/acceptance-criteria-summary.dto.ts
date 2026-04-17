import { CriteriaType } from '../../enums';

export class AcceptanceCriteriaSummaryDto {
  id!: string;
  criteriaType!: CriteriaType;
  content!: string;
}
