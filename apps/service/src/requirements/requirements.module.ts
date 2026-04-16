import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';
import {
  Requirement,
  UserStory,
  AcceptanceCriteria,
} from '@req2task/core';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement, UserStory, AcceptanceCriteria])],
  controllers: [RequirementsController],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
