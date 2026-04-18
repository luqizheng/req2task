import { AcceptanceCriteriaSummaryDto } from './acceptance-criteria-summary.dto';
export declare class CreateUserStoryDto {
    role: string;
    goal: string;
    benefit: string;
    storyPoints?: number;
}
export declare class UpdateUserStoryDto {
    role?: string;
    goal?: string;
    benefit?: string;
    storyPoints?: number;
}
export declare class UserStoryResponseDto {
    id: string;
    requirementId: string;
    role: string;
    goal: string;
    benefit: string;
    storyPoints: number;
    acceptanceCriteria?: AcceptanceCriteriaSummaryDto[];
    createdAt: Date;
    updatedAt: Date;
}
