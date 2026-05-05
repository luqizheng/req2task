import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureModule } from '@req2task/core';
import { FeatureModulesController } from './feature-modules.controller';
import { FeatureModulesService } from './feature-modules.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureModule]), AiModule],
  controllers: [FeatureModulesController],
  providers: [FeatureModulesService],
  exports: [FeatureModulesService],
})
export class FeatureModulesModule {}
