import { CollectionType } from './create-collection.dto';
import { RawRequirementStatus } from '../../enums/raw-requirement-status.enum';
import { UserResponseDto } from '../../user/dto';
export declare class RawRequirementCollectionResponseDto {
    id: string;
    projectId: string;
    title: string;
    collectionType: CollectionType;
    collectedBy: UserResponseDto;
    collectedAt: string;
    meetingMinutes?: string;
    rawRequirementCount: number;
    chatRoundCount: number;
    createdAt: string;
    updatedAt: string;
}
export declare class RawRequirementCollectionDetailDto extends RawRequirementCollectionResponseDto {
    rawRequirements: RawRequirementInCollectionDto[];
}
export declare class RawRequirementInCollectionDto {
    id: string;
    content: string;
    status: RawRequirementStatus;
    sessionHistory: ChatMessage[];
    followUpQuestions: string[];
    keyElements: string[];
    createdAt: string;
    updatedAt: string;
}
export declare class ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export declare class AddRawRequirementDto {
    content: string;
    source: string;
}
export declare class RawRequirementResponseDto {
    id: string;
    collectionId: string;
    content: string;
    source: string;
    status: RawRequirementStatus;
    sessionHistory: ChatMessage[];
    followUpQuestions: string[];
    keyElements: string[];
    analysisResult?: RequirementAnalysisResult;
    createdAt: string;
    updatedAt: string;
}
export declare class RequirementAnalysisResult {
    summary: string;
    keyElements: string[];
    followUpQuestions: string[];
    generatedRequirementId?: string;
}
export declare class FollowUpQuestionDto {
    question: string;
    context: string;
}
export declare class CollectionChatRequestDto {
    collectionId: string;
    message: string;
    rawRequirementId?: string;
}
export declare class CollectionChatResponseDto {
    message: ChatMessage;
    rawRequirementId: string;
    followUpQuestions: FollowUpQuestionDto[];
    analysisResult?: RequirementAnalysisResult;
}
export declare class ConvertToRequirementDto {
    rawRequirementId: string;
    moduleId: string;
    title?: string;
    description?: string;
    priority?: string;
}
