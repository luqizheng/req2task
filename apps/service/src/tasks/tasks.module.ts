import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskKanbanService } from './task-kanban.service';
import { Task, Requirement, FeatureModule } from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Requirement, FeatureModule])],
  controllers: [TasksController],
  providers: [TasksService, TaskKanbanService],
  exports: [TasksService, TaskKanbanService],
})
export class TasksModule {}
