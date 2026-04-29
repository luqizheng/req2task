import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777450609835 implements MigrationInterface {
    name = 'Init1777450609835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'archived')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255), "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'active', "system_prompt" text NOT NULL DEFAULT '', "message_count" integer NOT NULL DEFAULT '0', "summary" text, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_messages_role_enum" AS ENUM('user', 'assistant', 'system')`);
        await queryRunner.query(`CREATE TABLE "conversation_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "role" "public"."conversation_messages_role_enum" NOT NULL DEFAULT 'user', "content" text NOT NULL, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_113248f25c4c0a7c179b3f5a609" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."llm_configs_provider_enum" AS ENUM('deepseek', 'openai', 'ollama')`);
        await queryRunner.query(`CREATE TABLE "llm_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "provider" "public"."llm_configs_provider_enum" NOT NULL DEFAULT 'deepseek', "apiKey" character varying NOT NULL, "baseUrl" character varying, "model_name" character varying NOT NULL, "max_tokens" integer NOT NULL DEFAULT '4096', "temperature" numeric(3,2) NOT NULL DEFAULT '0.7', "top_p" numeric(3,2) NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_59d393b0d96abb589b3d0a1aa5b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD CONSTRAINT "FK_8e166abf2dd2ee28670e53e6803" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP CONSTRAINT "FK_8e166abf2dd2ee28670e53e6803"`);
        await queryRunner.query(`DROP TABLE "llm_configs"`);
        await queryRunner.query(`DROP TYPE "public"."llm_configs_provider_enum"`);
        await queryRunner.query(`DROP TABLE "conversation_messages"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_messages_role_enum"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
    }

}
