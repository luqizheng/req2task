import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RawRequirement, FileData, ProjectAttachment } from "@req2task/core";
import { RawRequirementService } from "./raw-requirement.service";
import { RawRequirementController } from "./raw-requirement.controller";
import { StorageService } from "../common/services/storage.service";

@Module({
  imports: [TypeOrmModule.forFeature([RawRequirement, FileData, ProjectAttachment])],
  controllers: [RawRequirementController],
  providers: [
    RawRequirementService,
    StorageService,
  ],
  exports: [RawRequirementService],
})
export class RawRequirementModule {}
