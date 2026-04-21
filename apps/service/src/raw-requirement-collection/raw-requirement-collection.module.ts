import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RawRequirementCollection } from "@req2task/core";
import { RawRequirementCollectionService } from "./raw-requirement-collection.service";
import { RawRequirementCollectionController } from "./raw-requirement-collection.controller";
import { RequirementGenerationService } from "../ai/requirement-generation.service";
import { LLMService, PromptService, ChromaVectorStore, FileParserService } from "@req2task/core";
import { AIChatClientService } from "../ai/ai-chat-client.service";
import { AIChatService } from "../ai/ai-chat.service";
import { RawRequirementModule } from "../raw-requirement/raw-requirement.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RawRequirementCollection]),
    RawRequirementModule,
  ],
  controllers: [RawRequirementCollectionController],
  providers: [
    RawRequirementCollectionService,
    RequirementGenerationService,
    LLMService,
    PromptService,
    ChromaVectorStore,
    FileParserService,
    AIChatClientService,
    AIChatService,
  ],
  exports: [
    RawRequirementCollectionService,
    AIChatClientService,
    AIChatService,
  ],
})
export class RawRequirementCollectionModule {}
