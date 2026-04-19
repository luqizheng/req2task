import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import {
  User,
  Project,
  FeatureModule,
  Requirement,
  RequirementChangeLog,
  UserStory,
  AcceptanceCriteria,
  Task,
  LLMConfig,
  Baseline,
  Notification,
  RawRequirement,
  RawRequirementCollection,
  Conversation,
  ConversationMessage,
} from "@req2task/core";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProjectsModule } from "./projects/projects.module";
import { FeatureModulesModule } from "./feature-modules/feature-modules.module";
import { RequirementsModule } from "./requirements/requirements.module";
import { TasksModule } from "./tasks/tasks.module";
import { AiModule } from "./ai/ai.module";
import { NotificationModule } from "./notifications/notification.module";
import { RawRequirementCollectionModule } from "./raw-requirement-collection/raw-requirement-collection.module";
import { DeveloperWsModule } from "./developer-ws/developer-ws.module";
import { SeedModule } from "./commands/seed/seed.module";
import { ConversationModule } from "./conversation/conversation.module";

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
        Task,
        LLMConfig,
        Baseline,
        Notification,
        RawRequirement,
        RawRequirementCollection,
        Conversation,
        ConversationMessage,
      ],
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    FeatureModulesModule,
    RequirementsModule,
    TasksModule,
    AiModule,
    NotificationModule,
    RawRequirementCollectionModule,
    DeveloperWsModule,
    SeedModule,
    ConversationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
