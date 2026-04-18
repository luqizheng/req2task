export declare enum CollectionType {
    MEETING = "meeting",
    INTERVIEW = "interview",
    DOCUMENT = "document",
    OTHER = "other"
}
export declare class CreateRawRequirementCollectionDto {
    projectId: string;
    title: string;
    collectionType: CollectionType;
    collectedAt?: string;
    meetingMinutes?: string;
}
export declare class UpdateRawRequirementCollectionDto {
    title?: string;
    collectionType?: CollectionType;
    collectedAt?: string;
    meetingMinutes?: string;
}
