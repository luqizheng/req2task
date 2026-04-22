import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { RawRequirementCollection, RawRequirement } from "@req2task/core";
import { RawRequirementCollectionService } from "./raw-requirement-collection.service";
import { RawRequirementCollectionController } from "./raw-requirement-collection.controller";

import { ChromaVectorStore, FileParserService } from "@req2task/core";

import { PromptsService } from "../ai/PromptsService";
import { RawRequirementModule } from "../raw-requirement/raw-requirement.module";
import { ProjectsService } from "../projects/projects.service";
import { ProjectsModule } from "src/projects/projects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([RawRequirementCollection, RawRequirement]),
    HttpModule,
    RawRequirementModule,
    ProjectsModule,
  ],
  controllers: [RawRequirementCollectionController],
  providers: [
    RawRequirementCollectionService,
    ChromaVectorStore,
    FileParserService,
    PromptsService,
    ProjectsService,
  ],
  exports: [RawRequirementCollectionService, PromptsService],
})
export class RawRequirementCollectionModule {}
