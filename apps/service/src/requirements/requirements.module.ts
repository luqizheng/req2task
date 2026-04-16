import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { RequirementStateService } from '@req2task/core';
import {
  Requirement,
  UserStory,
  AcceptanceCriteria,
  RequirementChangeLog,
} from '@req2task/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, RequirementChangeLog]),
  ],
  controllers: [RequirementsController],
  providers: [RequirementsService, RequirementStateService],
  exports: [RequirementsService, RequirementStateService],
})
export class RequirementsModule {}
