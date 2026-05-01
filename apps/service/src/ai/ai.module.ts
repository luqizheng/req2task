import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement, ChromaVectorStore } from '@req2task/core';
import { PromptModule } from '@req2task/core';
import { AiService } from './ai.service';
import { LLmClientService } from './llm-client.service';
import { AiGenerationService } from './ai-generation.service';
import { AiPersistenceService } from './ai-persistence.service';
import { AiGenerationController } from './ai-generation.controller';
import { AiRawRequirementController } from './ai-raw-requirement.controller';
import { RawRequirementModule } from '../raw-requirement/raw-requirement.module';
import { ProjectsModule } from '../projects/projects.module';
import { EntityKeyModule } from '../common/entity-key.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement]),
    HttpModule,
    PromptModule,
    forwardRef(() => RawRequirementModule),
    ProjectsModule,
    EntityKeyModule,
  ],
  controllers: [AiGenerationController, AiRawRequirementController],
  providers: [
    ChromaVectorStore,
    AiService,
    LLmClientService,
    AiGenerationService,
    AiPersistenceService,
  ],
  exports: [
    ChromaVectorStore,
    AiService,
    LLmClientService,
    AiGenerationService,
    AiPersistenceService,
  ],
})
export class AiModule {}
