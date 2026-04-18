import { CriteriaType } from '../../enums';
export declare class CreateAcceptanceCriteriaDto {
    criteriaType: CriteriaType;
    content: string;
    testMethod?: string;
}
export declare class UpdateAcceptanceCriteriaDto {
    criteriaType?: CriteriaType;
    content?: string;
    testMethod?: string;
}
export declare class AcceptanceCriteriaResponseDto {
    id: string;
    userStoryId: string;
    criteriaType: CriteriaType;
    content: string;
    testMethod: string | null;
    createdAt: Date;
    updatedAt: Date;
}
