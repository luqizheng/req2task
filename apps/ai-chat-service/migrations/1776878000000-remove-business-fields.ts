import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBusinessFields1776878000000 implements MigrationInterface {
    name = 'RemoveBusinessFields1776878000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "collection_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "raw_requirement_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "next_conversation_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "conversation_type"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "conversation_type" character varying(50) NOT NULL DEFAULT 'general'`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "next_conversation_id" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "raw_requirement_id" character varying(36)`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "collection_id" character varying(36)`);
    }
}
