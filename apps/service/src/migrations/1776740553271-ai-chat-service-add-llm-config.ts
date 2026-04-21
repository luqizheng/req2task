import { MigrationInterface, QueryRunner } from "typeorm";

export class AiChatServiceAddLlmConfig1776740553271 implements MigrationInterface {
    name = 'AiChatServiceAddLlmConfig1776740553271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "collection_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "raw_requirement_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "conversation_type" character varying(50) NOT NULL DEFAULT 'general'`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "conversation_type"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "raw_requirement_id" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "collection_id" uuid`);
    }

}
