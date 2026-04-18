import { RequirementStatus } from '../../enums';
export declare class TransitionStatusDto {
    targetStatus: RequirementStatus;
    comment?: string;
}
export declare class ReviewRequirementDto {
    approved: boolean;
    comment?: string;
}
export declare class AllowedTransitionsDto {
    allowedTransitions: RequirementStatus[];
}
export declare class RequirementChangeLogDto {
    id: string;
    requirementId: string;
    changeType: string;
    oldValue: string | null;
    newValue: string | null;
    fromStatus: RequirementStatus | null;
    toStatus: RequirementStatus | null;
    comment: string | null;
    changedBy: {
        id: string;
        displayName: string;
        username: string;
    };
    createdAt: Date;
}
export declare class ChangeHistoryResponseDto {
    logs: RequirementChangeLogDto[];
    total: number;
}
