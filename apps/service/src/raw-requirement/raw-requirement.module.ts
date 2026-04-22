import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { RawRequirement, FileData, ProjectAttachment } from "@req2task/core";
import { RawRequirementService } from "./raw-requirement.service";
import { RawRequirementController } from "./raw-requirement.controller";
import { RequirementCollectService } from "./requirement-collect.service";
import { AiService } from "../ai/ai.service";
import { FileConversionClientService } from "../common/services/file-conversion-client.service";
import { StorageService } from "../common/services/storage.service";
import { ProjectAttachmentService } from "../project-attachment/project-attachment.service";

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirement, FileData, ProjectAttachment]), HttpModule],
  controllers: [RawRequirementController],
  providers: [
    RawRequirementService,
    RequirementCollectService,
    AiService,
    FileConversionClientService,
    StorageService,
    ProjectAttachmentService,
  ],
  exports: [RawRequirementService],
})
export class RawRequirementModule {}
