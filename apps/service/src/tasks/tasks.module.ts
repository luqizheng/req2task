import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskKanbanService } from './task-kanban.service';
import { Task, Requirement, FeatureModule } from '@req2task/core';
import { EntityKeyModule } from '../common/entity-key.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Requirement, FeatureModule]), EntityKeyModule, AiModule],
  controllers: [TasksController],
  providers: [TasksService, TaskKanbanService],
  exports: [TasksService, TaskKanbanService],
})
export class TasksModule {}
