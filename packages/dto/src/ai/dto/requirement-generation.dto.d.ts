export declare class CreateRawRequirementDto {
    content: string;
}
export declare class GenerateRequirementResponseDto {
    id: string;
    title: string;
    description: string;
    priority: string;
    acceptanceCriteria: string[];
    userStories: {
        role: string;
        goal: string;
        benefit: string;
    }[];
}
export declare class GenerateUserStoriesDto {
    requirementContent: string;
    configId?: string;
}
export declare class GenerateAcceptanceCriteriaDto {
    requirementContent: string;
    configId?: string;
}
