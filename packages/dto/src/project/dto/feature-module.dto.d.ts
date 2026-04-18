export declare class CreateFeatureModuleDto {
    name: string;
    description?: string;
    moduleKey: string;
    sort?: number;
    parentId?: string;
    projectId: string;
}
export declare class UpdateFeatureModuleDto {
    name?: string;
    description?: string;
    sort?: number;
    parentId?: string;
}
export declare class FeatureModuleResponseDto {
    id: string;
    name: string;
    description: string | null;
    moduleKey: string;
    sort: number;
    parentId: string | null;
    projectId: string;
    children: FeatureModuleResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class FeatureModuleListResponseDto {
    items: FeatureModuleResponseDto[];
    total: number;
    page: number;
    limit: number;
}
