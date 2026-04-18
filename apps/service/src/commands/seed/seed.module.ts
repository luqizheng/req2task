import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeedService } from "./seed.service";
import {
  User,
  Project,
  FeatureModule,
  Requirement,
  RequirementChangeLog,
  UserStory,
  AcceptanceCriteria,
  RawRequirement,
  RawRequirementCollection,
  LLMConfig,
} from "@req2task/core";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "req2task",
      entities: [
        User,
        Project,
        FeatureModule,
        Requirement,
        RequirementChangeLog,
        UserStory,
        AcceptanceCriteria,
        RawRequirement,
        RawRequirementCollection,
        LLMConfig,
      ],
      synchronize: false,
    }),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
