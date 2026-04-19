import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

import {
  User,
  Project,
  FeatureModule,
  RawRequirement,
  RawRequirementCollection,
  Requirement,
  RequirementChangeLog,
  UserStory,
  AcceptanceCriteria,
  Task,
  LLMConfig,
  Baseline,
  Notification,
  Conversation,
  ChatMessage,
  ConversationMessage,
} from "@req2task/core";
dotenv.config({ path: ".env" });

const options: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "req2task",
  entities: [
    AcceptanceCriteria,
    Baseline,
    Conversation,
    User,
    Project,
    FeatureModule,
    RawRequirement,
    RawRequirementCollection,
    Requirement,
    RequirementChangeLog,
    UserStory,
    AcceptanceCriteria,
    Task,
    LLMConfig,
    Baseline,
    Notification,
    RequirementChangeLog,
    Conversation,
    
    ConversationMessage,
  ],
  migrations: ["./src/migrations/**/*{.js,.ts}"],
  migrationsTableName: "migrations",
  synchronize: false,
};

export const AppDataSource = new DataSource(options);
