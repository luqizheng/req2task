import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PromptModule } from "@req2task/core";
import {
  User,
  Project,
  FeatureModule,
  Requirement,
  RequirementChangeLog,
  UserStory,
  AcceptanceCriteria,
  Task,
  Baseline,
  Notification,
  RawRequirement,
  FileData,
  ProjectAttachment,
} from "@req2task/core";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ProjectsModule } from "./projects/projects.module";
import { FeatureModulesModule } from "./feature-modules/feature-modules.module";
import { RequirementsModule } from "./requirements/requirements.module";
import { TasksModule } from "./tasks/tasks.module";
import { NotificationModule } from "./notifications/notification.module";

import { DeveloperWsModule } from "./developer-ws/developer-ws.module";
import { SeedModule } from "./commands/seed/seed.module";
import { ProjectAttachmentModule } from "./project-attachment/project-attachment.module";
import { AiModule } from "./ai/ai.module";
import { RustFSModule } from "./rustfs/rustfs.module";
import { FileDataModule } from "./file-data/file-data.module";
import * as os from "os";

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
        Baseline,
        Notification,
        RawRequirement,
        FileData,
        ProjectAttachment,
      ],
      synchronize: false,
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    FeatureModulesModule,
    RequirementsModule,
    TasksModule,
    NotificationModule,
    DeveloperWsModule,
    SeedModule,
    ProjectAttachmentModule,
    PromptModule,
    AiModule,
    RustFSModule,
    ScheduleModule.forRoot(),
    FileDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    try {
      await nacosClient.ready();
      const serviceName = "req2task.service";

      // registry instance
      await nacosClient.registerInstance(serviceName, {
        ip: getIP(),
        port: 3000,
        instanceId: getIP(),
        weight: 1,
        healthy: false,
        enabled: true,
      });
      console.warn("Nacos naming client connected successfully");
    } catch (error) {
      console.warn("Nacos naming client connection failed:", error);
    }
  }
}
