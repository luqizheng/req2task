import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Project,
  User,
  Baseline,
  Requirement,
  Task,
  FeatureModule,
} from '@req2task/core';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BaselineService } from './baseline.service';
import { ProjectProgressService } from './project-progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, Baseline, Requirement, Task, FeatureModule]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, BaselineService, ProjectProgressService],
  exports: [ProjectsService, BaselineService, ProjectProgressService],
})
export class ProjectsModule {}
