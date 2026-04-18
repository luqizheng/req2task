import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRawRequirementCollectionEnhancements1776512500000 implements MigrationInterface {
  name = 'AddRawRequirementCollectionEnhancements1776512500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "raw_requirement_collections"
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active'
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirement_collections"
      ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "question_count" INTEGER NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "clarified_content" TEXT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "clarified_at" TIMESTAMP NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "collection_id" UUID NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "source" VARCHAR(200) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "session_history" JSONB NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "follow_up_questions" JSONB NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "key_elements" JSONB NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_raw_requirements_collection_id"
      ON "raw_requirements"("collection_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_raw_requirements_collection_id"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "key_elements"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "follow_up_questions"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "session_history"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "source"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "collection_id"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "clarified_at"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "clarified_content"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "question_count"`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP COLUMN IF EXISTS "completed_at"`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP COLUMN IF EXISTS "status"`);
  }
}
