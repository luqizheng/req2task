import { ConflictType } from '../../enums';

export class SearchResultDto {
  id!: string;
  content!: string;
  metadata?: Record<string, unknown>;
  score!: number;
}

export class ConflictDto {
  requirement1!: {
    id: string;
    content: string;
  };
  requirement2!: {
    id: string;
    content: string;
  };
  type!: ConflictType;
  description!: string;
  suggestion!: string;
}

export class ConflictDetectionResultDto {
  hasConflict!: boolean;
  conflicts!: ConflictDto[];
  relatedRequirements!: SearchResultDto[];
}
