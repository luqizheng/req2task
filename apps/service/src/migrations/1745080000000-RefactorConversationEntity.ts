import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorConversationEntity1745080000000 implements MigrationInterface {
    name = "RefactorConversationEntity1745080000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "next_conversation_id" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "conversations"."next_conversation_id" IS '链表指针 - 支持对话链'`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_next" FOREIGN KEY ("next_conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "conversation_type" varchar(50) NOT NULL DEFAULT 'general'`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "metadata" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "conversations"."conversation_type" IS '会话类型 - 业务可自定义'`);
        await queryRunner.query(`COMMENT ON COLUMN "conversations"."metadata" IS '业务元数据'`);

        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "collection_id"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "raw_requirement_id"`);

        await queryRunner.query(`ALTER TABLE "requirements" ADD COLUMN "conversation_id" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "requirements"."conversation_id" IS '对话关联 - 由需求自己决定'`);
        await queryRunner.query(`ALTER TABLE "requirements" ADD CONSTRAINT "FK_requirements_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_requirements_conversation" ON "requirements" ("conversation_id")`);

        await queryRunner.query(`ALTER TABLE "requirements" ADD COLUMN "review_chain_id" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "requirements"."review_chain_id" IS '评审链ID - 关联多个评审会话'`);

        await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "conversation_id" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "tasks"."conversation_id" IS '开发讨论对话关联'`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_conversation" ON "tasks" ("conversation_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_conversation"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_conversation"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "conversation_id"`);

        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "review_chain_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_requirements_conversation"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP CONSTRAINT "FK_requirements_conversation"`);
        await queryRunner.query(`ALTER TABLE "requirements" DROP COLUMN "conversation_id"`);

        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "raw_requirement_id" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN "collection_id" uuid`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "conversation_type"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_next"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "next_conversation_id"`);
    }

}
