import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRawRequirementChatColumns1776570000000 implements MigrationInterface {
  name = 'AddRawRequirementChatColumns1776570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "session_history" JSONB NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "follow_up_questions" JSONB NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "follow_up_questions"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "session_history"`);
  }
}
