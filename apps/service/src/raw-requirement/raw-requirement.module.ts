import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RawRequirement } from "@req2task/core";
import { RawRequirementService } from "./raw-requirement.service";
import { RawRequirementController } from "./raw-requirement.controller";
import { RequirementCollectService } from "./requirement-collect.service";
import { AIChatClientService } from "../ai/ai-chat-client.service";
import { FileConversionClientService } from "../common/services/file-conversion-client.service";
import { ProjectAttachmentService } from "../project-attachment/project-attachment.service";

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirement])],
  controllers: [RawRequirementController],
  providers: [
    RawRequirementService,
    RequirementCollectService,
    AIChatClientService,
    FileConversionClientService,
    ProjectAttachmentService,
  ],
  exports: [RawRequirementService],
})
export class RawRequirementModule {}
