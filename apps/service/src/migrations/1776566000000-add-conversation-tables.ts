import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationTables1776566000000 implements MigrationInterface {
  name = 'AddConversationTables1776566000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "collection_id" UUID NULL REFERENCES "raw_requirement_collections"("id") ON DELETE SET NULL,
        "raw_requirement_id" UUID NULL REFERENCES "raw_requirements"("id") ON DELETE SET NULL,
        "title" VARCHAR(255) NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "question_count" INTEGER NOT NULL DEFAULT 0,
        "message_count" INTEGER NOT NULL DEFAULT 0,
        "summary" TEXT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversation_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversation_id" UUID NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "role" VARCHAR(20) NOT NULL,
        "content" TEXT NOT NULL,
        "raw_requirement_id" UUID NULL REFERENCES "raw_requirements"("id") ON DELETE SET NULL,
        "metadata" JSONB NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirement_collections"
      ADD COLUMN IF NOT EXISTS "main_conversation_id" UUID NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirement_collections"
      ADD CONSTRAINT "fk_raw_requirement_collections_main_conversation"
      FOREIGN KEY ("main_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD COLUMN IF NOT EXISTS "conversation_id" UUID NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      ADD CONSTRAINT "fk_raw_requirements_conversation"
      FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      DROP COLUMN IF EXISTS "session_history"
    `);

    await queryRunner.query(`
      ALTER TABLE "raw_requirements"
      DROP COLUMN IF EXISTS "follow_up_questions"
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversations_collection_id" ON "conversations"("collection_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversations_raw_requirement_id" ON "conversations"("raw_requirement_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversations_status" ON "conversations"("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversation_messages_conversation_id" ON "conversation_messages"("conversation_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversation_messages_role" ON "conversation_messages"("role")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversation_messages_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversation_messages_conversation_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversations_raw_requirement_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversations_collection_id"`);

    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP CONSTRAINT IF EXISTS "fk_raw_requirements_conversation"`);
    await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN IF EXISTS "conversation_id"`);

    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP CONSTRAINT IF EXISTS "fk_raw_requirement_collections_main_conversation"`);
    await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP COLUMN IF EXISTS "main_conversation_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
  }
}
