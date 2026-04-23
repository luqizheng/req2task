import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RawRequirement, FileData, ProjectAttachment } from "@req2task/core";
import { RawRequirementService } from "./raw-requirement.service";
import { RawRequirementController } from "./raw-requirement.controller";
import { StorageService } from "../common/services/storage.service";
import { AiModule } from "../ai/ai.module";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirement, FileData, ProjectAttachment]), forwardRef(() => AiModule), forwardRef(() => ProjectsModule)],
  controllers: [RawRequirementController],
  providers: [
    RawRequirementService,
    StorageService,
  ],
  exports: [RawRequirementService],
})
export class RawRequirementModule {}
