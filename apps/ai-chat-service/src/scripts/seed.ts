import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import { LLMConfig } from "../database/entities/llm-config.entity.js";
import { LLMProviderType } from "../types.js";

async function seed() {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env["DATABASE_HOST"] || "localhost",
    port: parseInt(process.env["DATABASE_PORT"] || "5432", 10),
    username: process.env["DATABASE_USER"] || "postgres",
    password: process.env["DATABASE_PASSWORD"] || "postgres",
    database: process.env["DATABASE_NAME"] || "ai_chat",
    entities: [LLMConfig],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.warn("Database connected");

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.warn("Starting LLM config seed...");

    const ollamaConfig = await queryRunner.manager.findOne(LLMConfig, {
      where: { modelName: "qwen6:8b", provider: LLMProviderType.OLLAMA },
    });

    if (!ollamaConfig) {
      const config = queryRunner.manager.create(LLMConfig, {
        name: "Ollama Default",
        provider: LLMProviderType.OLLAMA,
        apiKey: "",
        baseUrl: "http://localhost:11434",
        modelName: "qwen3:0.6b",
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        isActive: true,
        isDefault: true,
      });
      await queryRunner.manager.save(config);
      console.warn("Created ollama LLM config (qwen6:8b)");
    } else {
      console.warn("ollama LLM config already exists, updating...");
      ollamaConfig.name = "Ollama Default";
      ollamaConfig.baseUrl = "http://localhost:11434";
      ollamaConfig.isActive = true;
      ollamaConfig.isDefault = true;
      await queryRunner.manager.save(ollamaConfig);
    }

    const deepseekConfig = await queryRunner.manager.findOne(LLMConfig, {
      where: { modelName: "deepseek-chat", provider: LLMProviderType.DEEPSEEK },
    });

    if (!deepseekConfig) {
      const config = queryRunner.manager.create(LLMConfig, {
        name: "DeepSeek Chat",
        provider: LLMProviderType.DEEPSEEK,
        apiKey: process.env["DEEPSEEK_API_KEY"] || "",
        baseUrl: "https://api.deepseek.com",
        modelName: "deepseek-chat",
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        isActive: false,
        isDefault: false,
      });
      await queryRunner.manager.save(config);
      console.warn("Created deepseek LLM config (deepseek-chat)");
    } else {
      console.warn("deepseek LLM config already exists, skipping...");
    }

    await queryRunner.commitTransaction();
    console.warn("LLM config seed completed successfully!");
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("LLM config seed failed!", error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});