import { Priority, RequirementSource, RequirementStatus } from '../../enums';
import { AcceptanceCriteriaSummaryDto } from './acceptance-criteria-summary.dto';
export declare class CreateRequirementDto {
    title: string;
    description?: string;
    priority?: Priority;
    source?: RequirementSource;
    parentRequirementId?: string;
    moduleIds?: string[];
}
export declare class UpdateRequirementDto {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: RequirementStatus;
    storyPoints?: number;
}
export declare class UserSummaryDto {
    id: string;
    displayName: string;
    username: string;
}
export declare class UserStorySummaryDto {
    id: string;
    role: string;
    goal: string;
    benefit: string;
    storyPoints: number;
    acceptanceCriteria?: AcceptanceCriteriaSummaryDto[];
}
export declare class ChildRequirementSummaryDto {
    id: string;
    title: string;
    priority: Priority;
    status: RequirementStatus;
}
export declare class RequirementResponseDto {
    id: string;
    moduleId: string | null;
    moduleIds: string[] | null;
    title: string;
    description: string | null;
    priority: Priority;
    source: RequirementSource;
    status: RequirementStatus;
    storyPoints: number;
    parentId: string | null;
    createdById: string;
    createdBy?: UserSummaryDto;
    userStories?: UserStorySummaryDto[];
    userStoryCount?: number;
    children?: ChildRequirementSummaryDto[];
    childCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RequirementListResponseDto {
    items: RequirementResponseDto[];
    total: number;
    page: number;
    limit: number;
}
