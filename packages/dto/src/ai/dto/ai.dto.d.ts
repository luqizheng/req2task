import { LLMProviderType } from '../../enums';
export declare class CreateLLMConfigDto {
    name: string;
    provider: LLMProviderType;
    apiKey: string;
    baseUrl?: string;
    modelName: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    isActive?: boolean;
    isDefault?: boolean;
}
export declare class UpdateLLMConfigDto {
    name?: string;
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    isActive?: boolean;
    isDefault?: boolean;
}
export declare class ChatRequestDto {
    message: string;
    configId?: string;
}
export declare class VectorDocumentDto {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}
export declare class VectorStoreRequestDto {
    documents: VectorDocumentDto[];
}
export declare class LLMConfigResponseDto {
    id: string;
    name: string;
    provider: LLMProviderType;
    modelName: string;
    baseUrl: string | null;
    maxTokens: number;
    temperature: number;
    topP: number;
    isActive: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
    apiKey?: string;
}
export declare class ChatResponseDto {
    content: string;
    configId?: string;
}
export declare class PromptTemplateResponseDto {
    code: string;
    name: string;
    category: string;
    description: string;
    systemPrompt: string;
    userPromptTemplate: string;
    temperature?: number;
    maxTokens?: number;
    isActive?: boolean;
    parameters: Array<{
        name: string;
        type: string;
        required?: boolean;
        defaultValue?: string;
        description?: string;
    }>;
}
