import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequirementsController } from './requirements.controller';
import { UserStoriesController } from './user-stories.controller';
import { AcceptanceCriteriaController } from './acceptance-criteria.controller';
import { RequirementsService } from './requirements.service';
import { UserStoriesService } from './user-stories.service';
import { AcceptanceCriteriaService } from './acceptance-criteria.service';
import { RequirementStateService } from '@req2task/core';
import {
  Requirement,
  UserStory,
  AcceptanceCriteria,
  RequirementChangeLog,
  FeatureModule,
} from '@req2task/core';
import { Repository } from 'typeorm';
import { RawRequirementModule } from '../raw-requirement/raw-requirement.module';
import { AiModule } from '../ai/ai.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { EntityKeyModule } from '../common/entity-key.module';
import { FeatureModulesModule } from '../feature-modules/feature-modules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requirement,
      UserStory,
      AcceptanceCriteria,
      RequirementChangeLog,
      FeatureModule,
    ]),
    forwardRef(() => RawRequirementModule),
    forwardRef(() => AiModule),
    forwardRef(() => ProjectsModule),
    EntityKeyModule,
    FeatureModulesModule,
  ],
  controllers: [RequirementsController, UserStoriesController, AcceptanceCriteriaController],
  providers: [
    RequirementsService,
    UserStoriesService,
    AcceptanceCriteriaService,
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
  exports: [RequirementsService, UserStoriesService, AcceptanceCriteriaService, RequirementStateService],
})
export class RequirementsModule {}
