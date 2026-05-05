import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Project,
  User,
  Baseline,
  Requirement,
  Task,
  FeatureModule,
  WizardService,
} from '@req2task/core';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BaselineService } from './baseline.service';
import { ProjectProgressService } from './project-progress.service';
import { WizardController } from './wizard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, Baseline, Requirement, Task, FeatureModule]),
  ],
  controllers: [ProjectsController, WizardController],
  providers: [ProjectsService, BaselineService, ProjectProgressService, WizardService],
  exports: [
    ProjectsService,
    BaselineService,
    ProjectProgressService,
    WizardService,
    TypeOrmModule,
  ],
})
export class ProjectsModule {}
