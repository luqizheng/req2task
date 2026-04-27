import { MigrationInterface, QueryRunner } from "typeorm";

export class File1777283438939 implements MigrationInterface {
    name = 'File1777283438939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "generated_content"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "error_message"`);
        await queryRunner.query(`CREATE TYPE "public"."file_data_status_enum" AS ENUM('normal', 'pending_delete')`);
        await queryRunner.query(`ALTER TABLE "file_data" ADD "status" "public"."file_data_status_enum" NOT NULL DEFAULT 'pending_delete'`);
        await queryRunner.query(`ALTER TABLE "file_data" ADD "created_by_id" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5d9f57209099b8d0b36862a2e7"`);
        await queryRunner.query(`ALTER TABLE "file_data" DROP COLUMN "file_hash"`);
        await queryRunner.query(`ALTER TABLE "file_data" ADD "file_hash" character varying(32) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5d9f57209099b8d0b36862a2e7" ON "file_data" ("file_hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5d9f57209099b8d0b36862a2e7"`);
        await queryRunner.query(`ALTER TABLE "file_data" DROP COLUMN "file_hash"`);
        await queryRunner.query(`ALTER TABLE "file_data" ADD "file_hash" character varying(64) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5d9f57209099b8d0b36862a2e7" ON "file_data" ("file_hash") `);
        await queryRunner.query(`ALTER TABLE "file_data" DROP COLUMN "created_by_id"`);
        await queryRunner.query(`ALTER TABLE "file_data" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."file_data_status_enum"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "error_message" text`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "generated_content" text`);
    }

}
