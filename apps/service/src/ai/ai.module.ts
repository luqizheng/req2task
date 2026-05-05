import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement, ChromaVectorStore } from '@req2task/core';
import { PromptModule } from '@req2task/core';
import { LLmClientService } from './llm-client.service';
import { AiGenerationService } from './ai-generation.service';
import { AiPersistenceService } from './ai-persistence.service';
import { RequirementVectorService } from './requirement-vector.service';
import { RawRequirementModule } from '../raw-requirement/raw-requirement.module';
import { ProjectsModule } from '../projects/projects.module';
import { EntityKeyModule } from '../common/entity-key.module';
import { createChromaVectorStore, initializeVectorStore } from './vector-store.providers';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria, Task, FeatureModule, RawRequirement]),
    HttpModule,
    PromptModule,
    forwardRef(() => RawRequirementModule),
    ProjectsModule,
    EntityKeyModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ChromaVectorStore,
      useFactory: (configService: ConfigService) => createChromaVectorStore(configService),
      inject: [ConfigService],
    },
    {
      provide: 'VECTOR_STORE_INIT',
      useFactory: (vectorStore: ChromaVectorStore) => initializeVectorStore(vectorStore),
      inject: [ChromaVectorStore],
    },
    LLmClientService,
    AiGenerationService,
    AiPersistenceService,
    RequirementVectorService,
  ],
  exports: [
    ChromaVectorStore,
    LLmClientService,
    AiGenerationService,
    AiPersistenceService,
    RequirementVectorService,
  ],
})
export class AiModule implements OnModuleInit {
  constructor(private vectorStore: ChromaVectorStore) {}

  async onModuleInit() {
    await initializeVectorStore(this.vectorStore);
  }
}
