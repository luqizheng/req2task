import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityKeyService } from './services/entity-key.service';
import {
  Requirement,
  RawRequirement,
  Task,
  Project,
} from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement, RawRequirement, Task, Project])],
  providers: [EntityKeyService],
  exports: [EntityKeyService],
})
export class EntityKeyModule {}
