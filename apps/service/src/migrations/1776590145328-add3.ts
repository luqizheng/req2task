import { MigrationInterface, QueryRunner } from "typeorm";

export class Add31776590145328 implements MigrationInterface {
    name = 'Add31776590145328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_raw_requirement_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP CONSTRAINT "conversation_messages_conversation_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_raw_requirement_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_collection_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP CONSTRAINT "fk_raw_requirement_collections_main_conversation"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP CONSTRAINT "fk_raw_requirements_conversation"`);
        await queryRunner.query(`DROP INDEX "public"."idx_conversation_messages_conversation_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_conversation_messages_role"`);
        await queryRunner.query(`DROP INDEX "public"."idx_conversations_collection_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_conversations_raw_requirement_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_conversations_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_raw_requirements_collection_id"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_messages_role_enum" AS ENUM('user', 'assistant', 'system')`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "role" "public"."conversation_messages_role_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'completed', 'archived')`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."raw_requirement_collections_status_enum" AS ENUM('active', 'completed')`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD "status" "public"."raw_requirement_collections_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TYPE "public"."raw_requirements_status_enum" RENAME TO "raw_requirements_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."raw_requirements_status_enum" AS ENUM('pending', 'processing', 'completed', 'clarified', 'converted', 'discarded', 'failed')`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" TYPE "public"."raw_requirements_status_enum" USING "status"::"text"::"public"."raw_requirements_status_enum"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."raw_requirements_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "session_history"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "session_history" json`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "follow_up_questions"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "follow_up_questions" json`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT '0.7'`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD CONSTRAINT "FK_8e166abf2dd2ee28670e53e6803" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD CONSTRAINT "FK_9bf90485d4d9b1aebf8bdbfa10b" FOREIGN KEY ("raw_requirement_id") REFERENCES "raw_requirements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_6a666dc9015354dc4ab374fbbb1" FOREIGN KEY ("collection_id") REFERENCES "raw_requirement_collections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_7a7188e1bcade4530df17948928" FOREIGN KEY ("raw_requirement_id") REFERENCES "raw_requirements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD CONSTRAINT "FK_71d7198bc3b23e2c50a33e6921b" FOREIGN KEY ("main_conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD CONSTRAINT "FK_4da68d141090b54e9844cf49b75" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP CONSTRAINT "FK_4da68d141090b54e9844cf49b75"`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP CONSTRAINT "FK_71d7198bc3b23e2c50a33e6921b"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_7a7188e1bcade4530df17948928"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_6a666dc9015354dc4ab374fbbb1"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP CONSTRAINT "FK_9bf90485d4d9b1aebf8bdbfa10b"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP CONSTRAINT "FK_8e166abf2dd2ee28670e53e6803"`);
        await queryRunner.query(`ALTER TABLE "llm_configs" ALTER COLUMN "temperature" SET DEFAULT 0.7`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "follow_up_questions"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "follow_up_questions" jsonb`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" DROP COLUMN "session_history"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD "session_history" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."raw_requirements_status_enum_old" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" TYPE "public"."raw_requirements_status_enum_old" USING "status"::"text"::"public"."raw_requirements_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."raw_requirements_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."raw_requirements_status_enum_old" RENAME TO "raw_requirements_status_enum"`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."raw_requirement_collections_status_enum"`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_messages_role_enum"`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD "role" character varying(20) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_raw_requirements_collection_id" ON "raw_requirements" ("collection_id") `);
        await queryRunner.query(`CREATE INDEX "idx_conversations_status" ON "conversations" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_conversations_raw_requirement_id" ON "conversations" ("raw_requirement_id") `);
        await queryRunner.query(`CREATE INDEX "idx_conversations_collection_id" ON "conversations" ("collection_id") `);
        await queryRunner.query(`CREATE INDEX "idx_conversation_messages_role" ON "conversation_messages" ("role") `);
        await queryRunner.query(`CREATE INDEX "idx_conversation_messages_conversation_id" ON "conversation_messages" ("conversation_id") `);
        await queryRunner.query(`ALTER TABLE "raw_requirements" ADD CONSTRAINT "fk_raw_requirements_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "raw_requirement_collections" ADD CONSTRAINT "fk_raw_requirement_collections_main_conversation" FOREIGN KEY ("main_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "raw_requirement_collections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "conversations_raw_requirement_id_fkey" FOREIGN KEY ("raw_requirement_id") REFERENCES "raw_requirements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_raw_requirement_id_fkey" FOREIGN KEY ("raw_requirement_id") REFERENCES "raw_requirements"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
