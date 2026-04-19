import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1776616821709 implements MigrationInterface {
    name = 'Init1776616821709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."project_attachments_target_type_enum" AS ENUM('requirement', 'task', 'user_story', 'project', 'conversation')`);
        await queryRunner.query(`CREATE TABLE "project_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_data_id" uuid NOT NULL, "target_type" "public"."project_attachments_target_type_enum" NOT NULL, "target_id" uuid NOT NULL, "display_name" character varying(255) NOT NULL, "description" text, "created_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e0adaaabd364382782d8ef14fcc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_25497171e8a20edcd967dcc56b" ON "project_attachments" ("target_type", "target_id") `);
        await queryRunner.query(`CREATE TABLE "file_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file_hash" character varying(64) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size" bigint NOT NULL, "storage_path" character varying(500) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_69875c852f5133f7ebea403609b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5d9f57209099b8d0b36862a2e7" ON "file_data" ("file_hash") `);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "next_conversation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD "conversation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD "review_chain_id" uuid`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "conversation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_09d70717ef50dd62880d7d1d580" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_7b34d4f3682f36386e9ba06edbd" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_attachments" ADD CONSTRAINT "FK_3c8b206b82fbf2c12ce197944ee" FOREIGN KEY ("file_data_id") REFERENCES "file_data"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_attachments" ADD CONSTRAINT "FK_0bba5b3e6621febe9fb6883ff81" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_attachments" DROP CONSTRAINT "FK_0bba5b3e6621febe9fb6883ff81"`);
        await queryRunner.query(`ALTER TABLE "project_attachments" DROP CONSTRAINT "FK_3c8b206b82fbf2c12ce197944ee"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_7b34d4f3682f36386e9ba06edbd"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_09d70717ef50dd62880d7d1d580"`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "conversation_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "review_chain_id"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "conversation_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "next_conversation_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d9f57209099b8d0b36862a2e7"`);
        await queryRunner.query(`DROP TABLE "file_data"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25497171e8a20edcd967dcc56b"`);
        await queryRunner.query(`DROP TABLE "project_attachments"`);
        await queryRunner.query(`DROP TYPE "public"."project_attachments_target_type_enum"`);
    }

}
