import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import { RequirementStateService } from '@req2task/core';
import {
  Requirement,
  UserStory,
  AcceptanceCriteria,
  RequirementChangeLog,
} from '@req2task/core';
import { Repository } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, RequirementChangeLog]),
  ],
  controllers: [RequirementsController],
  providers: [
    RequirementsService,
    {
      provide: RequirementStateService,
      inject: [
        getRepositoryToken(Requirement),
        getRepositoryToken(RequirementChangeLog),
      ],
      useFactory: (
        requirementRepository: Repository<Requirement>,
        changeLogRepository: Repository<RequirementChangeLog>,
      ) => {
        return new RequirementStateService(requirementRepository, changeLogRepository);
      },
    },
  ],
  exports: [RequirementsService, RequirementStateService],
})
export class RequirementsModule {}
