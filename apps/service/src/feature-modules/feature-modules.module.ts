import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureModule } from '@req2task/core';
import { FeatureModulesController } from './feature-modules.controller';
import { FeatureModulesService } from './feature-modules.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureModule])],
  controllers: [FeatureModulesController],
  providers: [FeatureModulesService],
  exports: [FeatureModulesService],
})
export class FeatureModulesModule {}
